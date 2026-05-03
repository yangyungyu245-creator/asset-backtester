"""Process pending ticker requests from a published Google Sheets CSV."""

from __future__ import annotations

import csv
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen

import yfinance as yf

from fetch_data import fetch_ticker

ROOT_DIR = Path(__file__).resolve().parents[1]
TICKERS_PATH = ROOT_DIR / "scripts" / "tickers.json"
STATUS_PATH = ROOT_DIR / "public" / "data" / "ticker-request-status.json"

ALLOWED_CATEGORIES = {"us_stock", "us_etf", "kr_stock", "kr_etf", "crypto"}
PENDING_STATUS = "pending"


def read_csv_rows(csv_url: str) -> list[dict[str, str]]:
    with urlopen(csv_url, timeout=30) as response:  # noqa: S310 - URL is a trusted CI secret.
        text = response.read().decode("utf-8-sig")

    return list(csv.DictReader(text.splitlines()))


def cell(row: dict[str, str], index: int, *names: str) -> str:
    lowered = {key.strip().lower(): (value or "").strip() for key, value in row.items() if key}
    for name in names:
        value = lowered.get(name.lower())
        if value:
            return value

    values = list(row.values())
    if index < len(values):
        return (values[index] or "").strip()

    return ""


def load_tickers() -> dict[str, list[dict[str, str]]]:
    with TICKERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def existing_symbols(config: dict[str, list[dict[str, str]]]) -> set[str]:
    return {
        item["ticker"].upper()
        for group in config.values()
        for item in group
        if isinstance(item, dict) and item.get("ticker")
    }


def validate_ticker_format(ticker: str, category: str) -> str | None:
    if category in {"us_stock", "us_etf"}:
        if re.fullmatch(r"[A-Z0-9.-]+", ticker):
            return None
        return "US ticker must contain only letters, numbers, hyphen, or dot."

    if category in {"kr_stock", "kr_etf"}:
        if re.fullmatch(r"\d{6}\.(KS|KQ)", ticker):
            return None
        return "KR ticker must look like 005930.KS or 035720.KQ."

    if category == "crypto":
        if re.fullmatch(r"[A-Z0-9-]+-USD", ticker):
            return None
        return "Crypto ticker must end with -USD."

    return f"Unsupported category: {category}"


def has_recent_yfinance_data(ticker: str) -> bool:
    history = yf.Ticker(ticker).history(period="1mo", auto_adjust=False, actions=False)
    return not history.empty


def reject(rejected: list[dict[str, str]], ticker: str, reason: str) -> None:
    rejected.append({"ticker": ticker or "(empty)", "reason": reason})
    print(f"[reject] {ticker or '(empty)'}: {reason}")


def main() -> None:
    csv_url = os.environ.get("GOOGLE_SHEETS_REQUEST_CSV_URL", "").strip()
    if not csv_url:
        print("[skip] GOOGLE_SHEETS_REQUEST_CSV_URL is not set.")
        return

    print("[start] Loading ticker requests CSV")
    rows = read_csv_rows(csv_url)
    config = load_tickers()
    community = config.setdefault("community", [])
    existing = existing_symbols(config)

    added: list[str] = []
    rejected: list[dict[str, str]] = []
    skipped_non_pending = 0
    pending_rows = 0

    for row_number, row in enumerate(rows, start=2):
        ticker = cell(row, 1, "ticker", "티커", "symbol").upper()
        name_ko = cell(row, 2, "name_ko", "nameKo", "표시 이름", "name")
        category = cell(row, 3, "category", "분류").lower()
        status = cell(row, 6, "status", "상태").lower()

        if status != PENDING_STATUS:
            skipped_non_pending += 1
            continue

        pending_rows += 1
        print(f"[pending] row={row_number} ticker={ticker} category={category}")

        if not ticker:
            reject(rejected, ticker, "ticker is empty")
            continue

        if category not in ALLOWED_CATEGORIES:
            reject(rejected, ticker, f"category must be one of {sorted(ALLOWED_CATEGORIES)}")
            continue

        format_error = validate_ticker_format(ticker, category)
        if format_error:
            reject(rejected, ticker, format_error)
            continue

        if ticker in existing:
            reject(rejected, ticker, "ticker already exists in tickers.json")
            continue

        try:
            if not has_recent_yfinance_data(ticker):
                reject(rejected, ticker, "yfinance returned no 1-month history")
                continue
        except Exception as error:  # noqa: BLE001 - keep processing other rows.
            reject(rejected, ticker, f"yfinance validation failed: {error}")
            continue

        item = {"ticker": ticker, "name_ko": name_ko or ticker, "category": category}

        try:
            fetch_ticker(item)
        except Exception as error:  # noqa: BLE001 - keep processing other rows.
            reject(rejected, ticker, f"data download failed: {error}")
            continue

        community.append(item)
        existing.add(ticker)
        added.append(ticker)
        print(f"[add] {ticker}: added to community and downloaded data")

    if added:
        community.sort(key=lambda item: item["ticker"])
        save_json(TICKERS_PATH, config)

    save_json(
        STATUS_PATH,
        {
            "last_updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "added": added,
            "rejected": rejected,
            "pending": [],
            "invalid": rejected,
        },
    )

    print("[summary]")
    print(f"- rows: {len(rows)}")
    print(f"- pending rows: {pending_rows}")
    print(f"- skipped non-pending rows: {skipped_non_pending}")
    print(f"- added: {len(added)}")
    print(f"- rejected: {len(rejected)}")

    if added:
        print(f"- added tickers: {', '.join(added)}")
    if rejected:
        print("- rejected details:")
        for item in rejected:
            print(f"  - {item['ticker']}: {item['reason']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001 - workflow step is continue-on-error, but logs should be clear.
        print(f"[error] Request processing failed: {error}", file=sys.stderr)
        raise
