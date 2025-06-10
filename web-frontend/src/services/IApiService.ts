export interface IApiService<TData, TQuery> {
  setData(data: TData): Promise<void>;
  getData(query: TQuery): Promise<TData | null>;
}