export type FxData = {
  from: "USD" | "JPY" | "EUR";
  to: "KRW";
  data_start: string;
  data_end: string;
  price_schema: ["date", "rate"];
  rates: [string, number][];
};

const fileMap = {
  USD: "_fx_usdkrw.json",
  JPY: "_fx_jpykrw.json",
  EUR: "_fx_eurkrw.json",
} as const;

const cache = new Map<keyof typeof fileMap, FxData>();

export async function loadFxData(currency: keyof typeof fileMap): Promise<FxData> {
  if (cache.has(currency)) {
    return cache.get(currency)!;
  }

  const res = await fetch(`/data/${fileMap[currency]}`);
  if (!res.ok) {
    throw new Error(`Failed to load FX ${currency}: ${res.status}`);
  }

  const data: FxData = await res.json();
  cache.set(currency, data);
  return data;
}
