"""Download market data from yfinance into static JSON files."""

from __future__ import annotations

import argparse
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import yfinance as yf
from tqdm import tqdm

ROOT_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT_DIR / "scripts"
DATA_DIR = ROOT_DIR / "public" / "data"
TICKERS_PATH = SCRIPTS_DIR / "tickers.json"
FX_SYMBOL = "KRW=X"
FX_SERIES = {
    "usdkrw": {
        "from": "USD",
        "to": "KRW",
        "file": "_fx_usdkrw.json",
        "candidates": ["KRW=X", "USDKRW=X"],
    },
    "jpykrw": {
        "from": "JPY",
        "to": "KRW",
        "file": "_fx_jpykrw.json",
        "candidates": ["JPYKRW=X", "KRWJPY=X"],
    },
    "eurkrw": {
        "from": "EUR",
        "to": "KRW",
        "file": "_fx_eurkrw.json",
        "candidates": ["EURKRW=X", "KRWEUR=X"],
    },
}

STAGE_ORDER = {
    "pilot": ["pilot"],
    "expanded": ["pilot", "expanded"],
    "full": ["pilot", "expanded", "full"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch yfinance data as static JSON.")
    parser.add_argument(
        "--stage",
        choices=["pilot", "expanded", "full"],
        default="pilot",
        help="Ticker stage to fetch. Later stages include earlier stages.",
    )
    parser.add_argument("--ticker", help="Fetch a single ticker symbol.")
    parser.add_argument("--fx-only", action="store_true", help="Fetch USD/KRW FX only.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing ticker files.")
    return parser.parse_args()


def load_ticker_config() -> dict[str, list[dict[str, str]]]:
    with TICKERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def stage_tickers(stage: str) -> list[dict[str, str]]:
    config = load_ticker_config()
    tickers: list[dict[str, str]] = []
    seen: set[str] = set()
    for stage_name in STAGE_ORDER[stage]:
        for item in config.get(stage_name, []):
            symbol = item["ticker"].upper()
            if symbol not in seen:
                seen.add(symbol)
                tickers.append(item)
    return tickers


def single_ticker(symbol: str) -> dict[str, str]:
    config = load_ticker_config()
    for items in config.values():
        for item in items:
            if item["ticker"].upper() == symbol.upper():
                return item
    return {"ticker": symbol.upper(), "name_ko": symbol.upper(), "category": "custom"}


def json_dump(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, separators=(",", ":"))


def safe_float(value: Any, digits: int = 4) -> float | None:
    if value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(numeric) or math.isinf(numeric):
        return None
    return round(numeric, digits)


def price_value(value: Any, currency: str) -> float | int | None:
    if currency == "KRW":
        numeric = safe_float(value, 0)
        return int(numeric) if numeric is not None else None
    return safe_float(value, 2)


def date_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if value <= 0:
            return None
        return datetime.fromtimestamp(value, tz=timezone.utc).date().isoformat()
    parsed = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(parsed):
        return None
    return parsed.date().isoformat()


def history_prices(history: pd.DataFrame, currency: str = "USD") -> list[list[Any]]:
    rows: list[list[Any]] = []
    if history.empty:
        return rows

    clean_history = history.reset_index()
    for _, row in clean_history.iterrows():
        adj_close = price_value(row.get("Adj Close", row.get("Close")), currency)
        day = date_string(row.get("Date"))
        if day is None or adj_close is None:
            continue
        rows.append([day, adj_close])
    return rows


def dividend_rows(dividends: pd.Series) -> list[list[Any]]:
    rows: list[list[Any]] = []
    if dividends.empty:
        return rows

    for index, amount in dividends.items():
        day = date_string(index)
        value = safe_float(amount)
        if day is None or value is None or value == 0:
            continue
        rows.append([day, value])
    return rows


def retry(operation_name: str, callback: Any, max_attempts: int = 3) -> Any:
    delays = [1, 3, 9]
    last_error: Exception | None = None
    for attempt in range(max_attempts):
        try:
            return callback()
        except Exception as error:  # noqa: BLE001 - keep ticker-level collection alive.
            last_error = error
            if attempt < max_attempts - 1:
                time.sleep(delays[attempt])
    raise RuntimeError(f"{operation_name} failed after {max_attempts} attempts") from last_error


def get_info(ticker: yf.Ticker) -> dict[str, Any]:
    def load() -> dict[str, Any]:
        try:
            return ticker.get_info()
        except AttributeError:
            return ticker.info

    try:
        info = retry("info", load)
        return info if isinstance(info, dict) else {}
    except Exception as error:  # noqa: BLE001
        print(f"[warn] info fetch failed: {error}")
        return {}


def infer_exchange(symbol: str, info: dict[str, Any]) -> str:
    exchange = info.get("exchange") or info.get("fullExchangeName")
    if isinstance(exchange, str) and exchange:
        return exchange
    if symbol.endswith(".KS"):
        return "KSC"
    return "NASDAQ"


def infer_currency(symbol: str, info: dict[str, Any]) -> str:
    currency = info.get("currency")
    if isinstance(currency, str) and currency:
        return currency
    if symbol.endswith(".KS"):
        return "KRW"
    return "USD"


def fetch_ticker(item: dict[str, str]) -> dict[str, Any]:
    symbol = item["ticker"].upper()
    ticker = yf.Ticker(symbol)
    info = get_info(ticker)
    currency = infer_currency(symbol, info)
    history = retry(
        f"{symbol} history",
        lambda: ticker.history(period="max", auto_adjust=False, actions=False),
    )
    prices = history_prices(history, currency)
    if not prices:
        raise RuntimeError(f"{symbol} has no price rows")

    dividends = retry(f"{symbol} dividends", lambda: ticker.dividends)
    dividend_data = dividend_rows(dividends)

    data_start = prices[0][0]
    data_end = prices[-1][0]
    first_trade_ms = info.get("firstTradeDateMilliseconds")
    ipo_date = date_string(info.get("firstTradeDateEpochUtc"))
    if ipo_date is None and isinstance(first_trade_ms, (int, float)):
        ipo_date = date_string(first_trade_ms / 1000)
    ipo_date = ipo_date or date_string(info.get("firstTradeDate")) or data_start

    payload = {
        "ticker": symbol,
        "name": info.get("longName") or info.get("shortName") or symbol,
        "name_ko": item.get("name_ko", symbol),
        "exchange": infer_exchange(symbol, info),
        "currency": currency,
        "category": item.get("category", "custom"),
        "ipo_date": ipo_date,
        "data_start": data_start,
        "data_end": data_end,
        "price_schema": ["date", "adj_close"],
        "prices": prices,
        "dividends": dividend_data,
    }
    json_dump(DATA_DIR / f"{symbol}.json", payload)
    return payload


def fetch_fx_series(series_key: str, config: dict[str, Any]) -> dict[str, Any]:
    best_symbol = config["candidates"][0]
    best_rates: list[list[Any]] = []
    failures: list[str] = []
    for symbol in config["candidates"]:
        try:
            ticker = yf.Ticker(symbol)
            history = retry(
                f"{symbol} FX history",
                lambda: ticker.history(period="max", auto_adjust=False, actions=False),
            )
            rates = history_prices(history, "USD")
            if rates and (not best_rates or rates[0][0] < best_rates[0][0]):
                best_symbol = symbol
                best_rates = rates
        except Exception as error:  # noqa: BLE001
            failures.append(f"{symbol}: {error}")

    rates = best_rates
    if not rates:
        raise RuntimeError(f"USD/KRW FX has no rows. Failures: {failures}")

    payload = {
        "from": config["from"],
        "to": config["to"],
        "source": best_symbol,
        "data_start": rates[0][0],
        "data_end": rates[-1][0],
        "price_schema": ["date", "rate"],
        "rates": rates,
    }
    json_dump(DATA_DIR / config["file"], payload)
    return payload


def fetch_all_fx() -> list[dict[str, Any]]:
    payloads = []
    for key, config in FX_SERIES.items():
        try:
            payloads.append(fetch_fx_series(key, config))
        except Exception as error:  # noqa: BLE001
            print(f"[warn] {key} fetch failed: {error}")
    return payloads


def existing_ticker_payloads() -> Iterable[dict[str, Any]]:
    for path in sorted(DATA_DIR.glob("*.json")):
        if path.name.startswith("_") or path.name == "index.json":
            continue
        try:
            with path.open("r", encoding="utf-8") as file:
                payload = json.load(file)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict) and payload.get("ticker"):
            yield payload


def update_index() -> dict[str, Any]:
    tickers = []
    for payload in existing_ticker_payloads():
        tickers.append(
            {
                "ticker": payload.get("ticker"),
                "name": payload.get("name"),
                "name_ko": payload.get("name_ko"),
                "exchange": payload.get("exchange"),
                "currency": payload.get("currency"),
                "category": payload.get("category"),
                "ipo_date": payload.get("ipo_date"),
            }
        )
    tickers.sort(key=lambda item: item["ticker"])
    index = {
        "tickers": tickers,
        "last_updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    json_dump(DATA_DIR / "index.json", index)
    return index


def collect(
    items: list[dict[str, str]], force: bool = False
) -> tuple[list[str], list[str], list[tuple[str, str]]]:
    successes: list[str] = []
    skipped: list[str] = []
    failures: list[tuple[str, str]] = []
    for item in tqdm(items, desc="Fetching tickers", unit="ticker"):
        symbol = item["ticker"].upper()
        target = DATA_DIR / f"{symbol}.json"
        if target.exists() and not force:
            skipped.append(symbol)
            continue
        try:
            fetch_ticker(item)
            successes.append(symbol)
        except Exception as error:  # noqa: BLE001
            failures.append((symbol, str(error)))
        time.sleep(0.2)
    return successes, skipped, failures


def main() -> None:
    args = parse_args()

    if args.fx_only:
        payloads = fetch_all_fx()
        update_index()
        for fx in payloads:
            print(f"FX {fx['from']}/{fx['to']} source: {fx.get('source')}")
            print(f"FX rows: {len(fx['rates'])}")
        return

    items = [single_ticker(args.ticker)] if args.ticker else stage_tickers(args.stage)
    successes, skipped, failures = collect(items, args.force)

    try:
        for fx in fetch_all_fx():
            print(f"FX {fx['from']}/{fx['to']} source: {fx.get('source')}")
            print(f"FX rows: {len(fx['rates'])}")
    except Exception as error:  # noqa: BLE001
        failures.append((FX_SYMBOL, str(error)))

    index = update_index()
    print(f"Success: {len(successes)}/{len(items)}")
    print(f"Skipped: {len(skipped)}/{len(items)}")
    print(f"Index tickers: {len(index['tickers'])}")
    if failures:
        print("Failures:")
        for symbol, message in failures:
            print(f"- {symbol}: {message}")
        if len(successes) == 0 and len(skipped) == 0:
            raise SystemExit(1)
        print("[warn] Some symbols failed, but available data was updated.")


if __name__ == "__main__":
    main()
