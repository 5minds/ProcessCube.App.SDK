export type RuntimeResults = {
  id: string;
  instances: Record<string, number>;
};

export type TimeRange =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_30_days'
  | 'this_year'
  | { custom: { startDate?: string; endDate?: string } };

export type FilterOptions = {
  timeRange: TimeRange;
};
