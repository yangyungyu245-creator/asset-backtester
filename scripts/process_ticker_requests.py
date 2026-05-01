"""Import approved ticker requests from a Google Sheets CSV export."""

from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

ROOT_DIR = Path(__file__).resolve().parents[1]
TICKERS_PATH = ROOT_DIR / "scripts" / "tickers.json"
STATUS_PATH = ROOT_DIR / "public" / "data" / "ticker-request-status.json"

VALID_CATEGORIES = {
    "us_stock",
    "us_etf",
    "kr_stock",
    "kr_etf",
    "intl_stock",
    "intl_etf",
    "crypto",
}
APPROVED = {"approved", "approve", "승인", "added", "add"}
REJECTED = {"rejected", "reject", "거부", "denied", "deny"}


def normalize_key(row: dict[str, str], *keys: str) -> str:
    lowered = {key.strip().lower(): value.strip() for key, value in row.items() if key}
    for key in keys:
        value = lowered.get(key.lower())
        if value:
            return value
    return ""


def load_rows(csv_url: str) -> list[dict[str, str]]:
    with urlopen(csv_url, timeout=30) as response:  # noqa: S310 - URL is a trusted CI secret.
        text = response.read().decode("utf-8-sig")
    return list(csv.DictReader(text.splitlines()))


def load_tickers() -> dict[str, list[dict[str, str]]]:
    with TICKERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def main() -> None:
    csv_url = os.environ.get("GOOGLE_SHEETS_REQUEST_CSV_URL")
    if not csv_url:
        print("GOOGLE_SHEETS_REQUEST_CSV_URL is not set. Skipping requests.")
        return

    rows = load_rows(csv_url)
    config = load_tickers()
    community = config.setdefault("community", [])
    existing = {
        item["ticker"].upper()
        for group in config.values()
        for item in group
        if isinstance(item, dict) and item.get("ticker")
    }

    added: list[str] = []
    rejected: list[dict[str, str]] = []
    pending: list[str] = []
    invalid: list[dict[str, str]] = []

    for row in rows:
        ticker = normalize_key(row, "ticker", "티커", "symbol").upper()
        status = normalize_key(row, "status", "admin_status", "상태").lower()
        name_ko = normalize_key(row, "nameKo", "name_ko", "표시 이름", "name")
        category = normalize_key(row, "category", "분류") or "us_stock"
        reason = normalize_key(row, "reason", "reject_reason", "거부 사유")

        if not ticker:
            continue

        if status in APPROVED:
            if category not in VALID_CATEGORIES:
                invalid.append({"ticker": ticker, "reason": f"invalid category: {category}"})
                continue
            if ticker in existing:
                continue
            community.append(
                {
                    "ticker": ticker,
                    "name_ko": name_ko or ticker,
                    "category": category,
                }
            )
            existing.add(ticker)
            added.append(ticker)
        elif status in REJECTED:
            rejected.append({"ticker": ticker, "reason": reason or "관리자 검토 결과 거부"})
        else:
            pending.append(ticker)

    if added:
        community.sort(key=lambda item: item["ticker"])
        save_json(TICKERS_PATH, config)

    save_json(
        STATUS_PATH,
        {
            "last_updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "added": added,
            "rejected": rejected,
            "pending": pending,
            "invalid": invalid,
        },
    )

    print(f"Added requests: {len(added)}")
    print(f"Rejected requests: {len(rejected)}")
    print(f"Pending requests: {len(pending)}")
    print(f"Invalid requests: {len(invalid)}")


if __name__ == "__main__":
    main()
