"""
Validate advanced simulation math against local market data.

If yfinance is installed and network access is available, the script also prints
yfinance-derived reference values for the same cases. Local data validation does
not require network access.
"""

from __future__ import annotations

import json
from bisect import bisect_left, bisect_right
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"


def load_json(name: str) -> dict:
    with (DATA / name).open("r", encoding="utf-8") as file:
        return json.load(file)


def lookup_value(series: list[list], target_date: str) -> float | None:
    dates = [row[0] for row in series]
    index = bisect_right(dates, target_date) - 1
    if index < 0:
        return None
    return float(series[index][1])


def next_trading_day(series: list[list], target_date: str) -> str | None:
    dates = [row[0] for row in series]
    index = bisect_left(dates, target_date)
    if index >= len(series):
        return None
    return str(series[index][0])


def fx_rate(currency: str, date: str) -> float:
    if currency == "KRW":
        return 1.0
    file_map = {
        "USD": "_fx_usdkrw.json",
        "JPY": "_fx_jpykrw.json",
        "EUR": "_fx_eurkrw.json",
    }
    fx = load_json(file_map[currency])
    return lookup_value(fx["rates"], date) or float(fx["rates"][0][1])


def lump_sum_case(
    portfolio: Iterable[tuple[str, float]],
    start_date: str,
    end_date: str,
    initial_krw: float,
    apply_fx: bool = True,
) -> float:
    holdings: dict[str, float] = {}
    ticker_data = {ticker: load_json(f"{ticker}.json") for ticker, _ in portfolio}
    weight_sum = sum(weight for _, weight in portfolio)

    for ticker, weight in portfolio:
        data = ticker_data[ticker]
        buy_date = next_trading_day(data["prices"], start_date)
        if buy_date is None:
            raise ValueError(f"No buy date for {ticker}")
        price = lookup_value(data["prices"], buy_date)
        if price is None:
            raise ValueError(f"No buy price for {ticker}")
        allocation_krw = initial_krw * (weight / weight_sum)
        rate = fx_rate(data["currency"], buy_date) if apply_fx else 1.0
        trade_amount = allocation_krw if data["currency"] == "KRW" else allocation_krw / rate
        holdings[ticker] = trade_amount / price

    final = 0.0
    for ticker, shares in holdings.items():
        data = ticker_data[ticker]
        price = lookup_value(data["prices"], end_date)
        if price is None:
            raise ValueError(f"No end price for {ticker}")
        rate = fx_rate(data["currency"], end_date) if apply_fx else 1.0
        final += shares * price if data["currency"] == "KRW" else shares * price * rate
    return final


def add_months(year_month: str, months: int) -> str:
    year, month = (int(part) for part in year_month.split("-"))
    month_index = year * 12 + (month - 1) + months
    return f"{month_index // 12:04d}-{month_index % 12 + 1:02d}"


def month_start(year_month: str) -> str:
    return f"{year_month}-01"


def monthly_contribution(
    year_month: str, schedule: Iterable[tuple[str, str, float]]
) -> float:
    for start, end, amount in schedule:
        if start <= year_month <= end:
            return amount
    return 0.0


def dca_case(
    portfolio: Iterable[tuple[str, float]],
    start_date: str,
    end_date: str,
    initial_krw: float,
    schedule: Iterable[tuple[str, str, float]],
    apply_fx: bool = True,
) -> tuple[float, float]:
    portfolio = list(portfolio)
    ticker_data = {ticker: load_json(f"{ticker}.json") for ticker, _ in portfolio}
    weight_sum = sum(weight for _, weight in portfolio)
    holdings: dict[str, float] = {}
    total_contributions = 0.0

    def buy(amount_krw: float, target_date: str) -> None:
        nonlocal total_contributions
        if amount_krw <= 0:
            return
        for ticker, weight in portfolio:
            data = ticker_data[ticker]
            buy_date = next_trading_day(data["prices"], target_date)
            if buy_date is None or buy_date > end_date:
                continue
            price = lookup_value(data["prices"], buy_date)
            if price is None:
                continue
            allocation_krw = amount_krw * (weight / weight_sum)
            rate = fx_rate(data["currency"], buy_date) if apply_fx else 1.0
            trade_amount = (
                allocation_krw if data["currency"] == "KRW" else allocation_krw / rate
            )
            holdings[ticker] = holdings.get(ticker, 0.0) + trade_amount / price
        total_contributions += amount_krw

    buy(initial_krw, start_date)
    year_month = start_date[:7]
    end_year_month = end_date[:7]
    while year_month <= end_year_month:
        target_date = start_date if year_month == start_date[:7] else month_start(year_month)
        buy(monthly_contribution(year_month, schedule), target_date)
        year_month = add_months(year_month, 1)

    final = 0.0
    for ticker, shares in holdings.items():
        data = ticker_data[ticker]
        price = lookup_value(data["prices"], end_date)
        if price is None:
            raise ValueError(f"No end price for {ticker}")
        rate = fx_rate(data["currency"], end_date) if apply_fx else 1.0
        final += shares * price if data["currency"] == "KRW" else shares * price * rate
    return final, total_contributions


def print_case(name: str, actual: float, expected: float | None = None) -> None:
    print(f"{name}: {actual:,.0f} KRW")
    if expected:
        diff = (actual - expected) / expected * 100
        print(f"  expected: {expected:,.0f} KRW, diff: {diff:.2f}%")


def try_yfinance_reference() -> None:
    try:
        import yfinance as yf  # type: ignore
    except Exception as exc:
        print(f"yfinance reference skipped: {exc}")
        return

    try:
        aapl = yf.Ticker("AAPL").history(
            start="2020-01-01", end="2021-01-05", auto_adjust=False
        )
        usdkrw = yf.Ticker("KRW=X").history(start="2020-01-01", end="2021-01-05")
        start_price = float(aapl["Adj Close"].iloc[0])
        end_price = float(aapl["Adj Close"].loc["2020-12-31"])
        start_fx = float(usdkrw["Close"].iloc[0])
        end_fx = float(usdkrw["Close"].loc["2020-12-31"])
        shares = (1_000_000 / start_fx) / start_price
        final_krw = shares * end_price * end_fx
        print_case("yfinance AAPL 2020", final_krw)
    except Exception as exc:
        print(f"yfinance reference failed: {exc}")


def main() -> None:
    case1 = lump_sum_case([("AAPL", 100)], "2020-01-02", "2020-12-31", 1_000_000)
    case2 = lump_sum_case([("005930.KS", 100)], "2020-01-02", "2020-12-31", 1_000_000)
    case3 = lump_sum_case(
        [("SPY", 50), ("005930.KS", 50)],
        "2015-01-02",
        "2024-12-31",
        10_000_000,
    )
    scenario_a, scenario_a_principal = dca_case(
        [("AAPL", 100)],
        "2020-01-01",
        "2024-12-31",
        10_000_000,
        [("2020-01", "2024-12", 0)],
    )
    scenario_b, scenario_b_principal = dca_case(
        [("AAPL", 50), ("SPY", 30), ("005930.KS", 20)],
        "2018-01-01",
        "2024-12-31",
        5_000_000,
        [("2018-01", "2024-12", 300_000)],
    )
    scenario_c, scenario_c_principal = dca_case(
        [("SPY", 100)],
        "2015-01-01",
        "2024-12-31",
        1_000_000,
        [
            ("2015-01", "2017-12", 100_000),
            ("2018-01", "2020-12", 300_000),
            ("2021-01", "2024-12", 500_000),
        ],
    )

    print_case("Local AAPL 2020", case1)
    print_case("Local Samsung 2020", case2)
    print_case("Local SPY 50 + Samsung 50, 2015-2024", case3)
    print_case("Scenario A AAPL 2020-2024", scenario_a)
    print(f"  principal: {scenario_a_principal:,.0f} KRW")
    print_case("Scenario B mixed DCA 2018-2024", scenario_b)
    print(f"  principal: {scenario_b_principal:,.0f} KRW")
    print_case("Scenario C SPY tiered DCA 2015-2024", scenario_c)
    print(f"  principal: {scenario_c_principal:,.0f} KRW")
    try_yfinance_reference()


if __name__ == "__main__":
    main()
