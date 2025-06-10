import type { IApiService } from './IApiService';

export class ApiService<TData, TQuery> implements IApiService<TData, TQuery> {
  private setUrl: string;
  private getUrl: string;

  constructor(setUrl: string, getUrl: string) {
    this.setUrl = setUrl;
    this.getUrl = getUrl;
  }

  async setData(data: TData): Promise<void> {
    const response = await fetch(this.setUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!response.ok) throw new Error('Failed to set data');
  }

  async getData(query: TQuery): Promise<TData | null> {
    const response = await fetch(this.getUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!response.ok) throw new Error('Failed to get data');
    return response.json();
  }
}