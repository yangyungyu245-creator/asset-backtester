export type FxRate = {
  date: string;
  rate: number;
};

export type FxSeries = {
  from: string;
  to: string;
  rates: FxRate[];
};
