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
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
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
    <div className="WellBeingForm" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3e8ff 100%)',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(100,108,255,0.10)',
      padding: 36,
      maxWidth: 440,
      margin: '0 auto',
      marginBottom: 40,
      border: '1.5px solid #e0e7ff',
      transition: 'box-shadow 0.2s',
    }}>
      <h2 style={{ color: '#3b3b5c', marginBottom: 28, letterSpacing: 1, fontWeight: 700 }}>{label}</h2>
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontWeight: 600, color: '#4b5563' }}>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
            marginTop: 6,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1.5px solid #c7d2fe',
            fontSize: 17,
            width: '100%',
            background: '#f1f5f9',
            color: '#22223b',
            outline: 'none',
            transition: 'border 0.2s',
          }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontWeight: 600, color: '#4b5563' }}>
          Type
          <select value={type as string} onChange={e => setType(e.target.value as TType)} style={{
            marginTop: 6,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1.5px solid #c7d2fe',
            fontSize: 17,
            width: '100%',
            background: '#f1f5f9',
            color: '#22223b',
            outline: 'none',
            transition: 'border 0.2s',
          }}>
            {Object.entries(typeOptions).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontWeight: 600, color: '#4b5563' }}>
          Value
          <input type="number" value={value} onChange={e => setValue(e.target.value)} style={{
            marginTop: 6,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1.5px solid #c7d2fe',
            fontSize: 17,
            width: '100%',
            background: '#f1f5f9',
            color: '#22223b',
            outline: 'none',
            transition: 'border 0.2s',
          }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18 }}>
        <button onClick={handleSet} style={{
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 28px',
          fontWeight: 700,
          fontSize: 17,
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(100,108,255,0.08)',
          letterSpacing: 0.5,
          transition: 'background 0.2s',
        }}>Set Data</button>
        <button onClick={handleGet} style={{
          background: '#60a5fa',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 28px',
          fontWeight: 700,
          fontSize: 17,
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(100,108,255,0.08)',
          letterSpacing: 0.5,
          transition: 'background 0.2s',
        }}>Get Data</button>
      </div>
      {error && <div style={{ color: '#d32f2f', marginTop: 10, fontWeight: 600 }}>{error}</div>}
      {result && <pre style={{
        marginTop: 20,
        background: 'linear-gradient(90deg, #f1f5f9 60%, #e0e7ff 100%)',
        borderRadius: 10,
        padding: 18,
        color: '#22223b',
        fontSize: 15,
        textAlign: 'left',
        overflowX: 'auto',
        border: '1.5px solid #e0e7ff',
      }}>{result}</pre>}
    </div>
  );
}
