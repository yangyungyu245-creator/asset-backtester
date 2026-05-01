"""Quickly validate yfinance ticker symbols before full downloads."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

import yfinance as yf
from tqdm import tqdm

ROOT_DIR = Path(__file__).resolve().parents[1]
TICKERS_PATH = ROOT_DIR / "scripts" / "tickers.json"

STAGE_ORDER = {
    "pilot": ["pilot"],
    "expanded": ["pilot", "expanded"],
    "full": ["pilot", "expanded", "full", "phase9"],
    "phase9": ["phase9"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate ticker symbols with yfinance.")
    parser.add_argument(
        "--stage",
        choices=["pilot", "expanded", "full", "phase9"],
        default="full",
        help="Stage to validate. Later stages include earlier stages.",
    )
    parser.add_argument("--new-only", action="store_true", help="Validate only the named stage.")
    return parser.parse_args()


def load_config() -> dict[str, list[dict[str, str]]]:
    with TICKERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def stage_items(stage: str, new_only: bool) -> list[dict[str, str]]:
    config = load_config()
    stage_names = [stage] if new_only else STAGE_ORDER[stage]
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for stage_name in stage_names:
        for item in config.get(stage_name, []):
            ticker = item["ticker"].upper()
            if ticker in seen:
                continue
            seen.add(ticker)
            items.append(item)
    return items


def validate_symbol(symbol: str) -> tuple[bool, str]:
    try:
        history = yf.Ticker(symbol).history(period="1mo", auto_adjust=False, actions=False)
    except Exception as error:  # noqa: BLE001
        return False, str(error)
    if history.empty:
        return False, "empty 1mo history"
    return True, f"{len(history)} rows"


def main() -> None:
    args = parse_args()
    items = stage_items(args.stage, args.new_only)
    valid: list[str] = []
    invalid: list[tuple[str, str]] = []

    for item in tqdm(items, desc="Validating tickers", unit="ticker"):
        symbol = item["ticker"].upper()
        ok, message = validate_symbol(symbol)
        if ok:
            valid.append(symbol)
        else:
            invalid.append((symbol, message))
        time.sleep(0.1)

    print(f"Attempted: {len(items)}")
    print(f"Valid: {len(valid)}")
    print(f"Invalid: {len(invalid)}")
    if invalid:
        print("Invalid tickers:")
        for symbol, message in invalid:
            print(f"- {symbol}: {message}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
