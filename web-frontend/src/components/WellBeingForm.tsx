import { useState } from 'react';
import { ApiService } from '../services/ApiService';

interface WellBeingFormProps<TData, TQuery, TType = string> {
  label: string;
  typeOptions: Record<string, string>;
  apiService: ApiService<TData, TQuery>;
  initialType: TType;
  buildData: (date: string, value: string, type: TType) => TData;
  buildQuery: (date: string, type: TType) => TQuery;
}

export function WellBeingForm<TData, TQuery, TType = string>({
  label,
  typeOptions,
  apiService,
  initialType,
  buildData,
  buildQuery
}: WellBeingFormProps<TData, TQuery, TType>) {
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<TType>(initialType);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSet = async () => {
    setError(null);
    try {
      const data = buildData(date, value, type);
      await apiService.setData(data);
      setResult('Data saved!');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGet = async () => {
    setError(null);
    try {
      const query = buildQuery(date, type);
      const data = await apiService.getData(query);
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="WellBeingForm">
      <h2>{label}</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label style={{ marginLeft: 8 }}>
          Type:
          <select value={type as string} onChange={e => setType(e.target.value as TType)}>
            {Object.entries(typeOptions).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 8 }}>
          Value: <input type="number" value={value} onChange={e => setValue(e.target.value)} />
        </label>
      </div>
      <button onClick={handleSet}>Set Data</button>
      <button onClick={handleGet} style={{ marginLeft: 8 }}>Get Data</button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {result && <pre style={{ marginTop: 16 }}>{result}</pre>}
    </div>
  );
}
