import React, { useState } from 'react';
import { setData, getData, getAllData } from '../api';
import { ObservationType, SymptomType } from '../types/enums';

const apiCommands = [
  { name: 'setData', description: 'Set Well-Being Data (Observation or Symptom)' },
  { name: 'getData', description: 'Get Well-Being Data (by date/type)' },
  { name: 'getAllData', description: 'Get All Well-Being Data (range, types)' },
];

export const ApiTestPage: React.FC = () => {
  const [command, setCommand] = useState(apiCommands[0].name);
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [observationType, setObservationType] = useState<ObservationType>(ObservationType.Food);
  const [symptomType, setSymptomType] = useState<SymptomType>(SymptomType.Headache);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setResult(null);
    try {
      if (command === 'setData') {
        const data = {
          dataType: observationType ? 'observation' : 'symptom',
          date,
          value: value ? Number(value) : null,
          ...(observationType ? { observationType } : {}),
          ...(symptomType ? { symptomType } : {}),
        };
        await setData(data as any);
        setResult('Success');
      } else if (command === 'getData') {
        const query = observationType
          ? { dataType: 'observation', date, observationType }
          : { dataType: 'symptom', date, symptomType };
        const res = await getData(query as any);
        setResult(res);
      } else if (command === 'getAllData') {
        const res = await getAllData({
          startDate,
          endDate,
          observationType,
          symptomType,
        });
        setResult(res);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h2>API Test Page</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Command:&nbsp;
          <select value={command} onChange={e => setCommand(e.target.value)}>
            {apiCommands.map(cmd => (
              <option key={cmd.name} value={cmd.name}>{cmd.description}</option>
            ))}
          </select>
        </label>
      </div>
      {(command === 'setData' || command === 'getData') && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Observation Type: <select value={observationType} onChange={e => setObservationType(e.target.value as ObservationType)}>
              {Object.values(ObservationType).map(t => <option key={t} value={t}>{t}</option>)}
            </select></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Symptom Type: <select value={symptomType} onChange={e => setSymptomType(e.target.value as SymptomType)}>
              {Object.values(SymptomType).map(t => <option key={t} value={t}>{t}</option>)}
            </select></label>
          </div>
        </>
      )}
      {command === 'setData' && (
        <div style={{ marginBottom: 8 }}>
          <label>Value: <input type="number" value={value} onChange={e => setValue(e.target.value)} /></label>
        </div>
      )}
      {command === 'getAllData' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label>Start Date: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>End Date: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Observation Type: <select value={observationType} onChange={e => setObservationType(e.target.value as ObservationType)}>
              {Object.values(ObservationType).map(t => <option key={t} value={t}>{t}</option>)}
            </select></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Symptom Type: <select value={symptomType} onChange={e => setSymptomType(e.target.value as SymptomType)}>
              {Object.values(SymptomType).map(t => <option key={t} value={t}>{t}</option>)}
            </select></label>
          </div>
        </>
      )}
      <button onClick={handleRun} style={{ marginTop: 12, padding: '8px 24px' }}>Run</button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {result && <pre style={{ marginTop: 16, background: '#f3f4f6', padding: 16, borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default ApiTestPage;
