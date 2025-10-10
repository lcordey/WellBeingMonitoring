import React, { useMemo, useState } from 'react';
import { setData, getData, getAllData, type WellBeingEntry } from '../api';
import { ObservationType, SymptomType } from '../types/enums';

const apiCommands = [
  { name: 'setData', description: 'Set Well-Being Data (Observation or Symptom)' },
  { name: 'getData', description: 'Get Well-Being Data (by date/type)' },
  { name: 'getAllData', description: 'Get All Well-Being Data (range, types)' },
];

export const ApiTestPage: React.FC = () => {
  const [command, setCommand] = useState(apiCommands[0].name);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState('');
  const [dataCategory, setDataCategory] = useState<'observation' | 'symptom'>('observation');
  const [observationType, setObservationType] = useState<ObservationType>(ObservationType.Food);
  const [symptomType, setSymptomType] = useState<SymptomType>(SymptomType.Headache);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rangeObservationTypes, setRangeObservationTypes] = useState<ObservationType[]>([]);
  const [rangeSymptomTypes, setRangeSymptomTypes] = useState<SymptomType[]>([]);
  const [result, setResult] = useState<WellBeingEntry[] | string | object | null>(null);
  const [error, setError] = useState<string | null>(null);

  const observationOptions = useMemo(
    () => Object.values(ObservationType).filter((value): value is ObservationType => typeof value === 'string'),
    []
  );
  const symptomOptions = useMemo(
    () => Object.values(SymptomType).filter((value): value is SymptomType => typeof value === 'string'),
    []
  );

  const toggleObservationFilter = (type: ObservationType) => {
    setRangeObservationTypes((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]
    );
  };

  const toggleSymptomFilter = (type: SymptomType) => {
    setRangeSymptomTypes((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]
    );
  };

  const handleRun = async () => {
    setError(null);
    setResult(null);
    try {
      if (command !== 'getAllData' && !date) {
        throw new Error('Please select a date.');
      }

      if (command === 'setData') {
        if (!value) {
          throw new Error('A numeric value is required to create data.');
        }

        if (dataCategory === 'observation' && !observationType) {
          throw new Error('Select an observation type.');
        }

        if (dataCategory === 'symptom' && !symptomType) {
          throw new Error('Select a symptom type.');
        }

        const data = {
          dataType: dataCategory,
          date,
          value: value ? Number(value) : null,
          ...(dataCategory === 'observation' ? { observationType } : {}),
          ...(dataCategory === 'symptom' ? { symptomType } : {}),
        };
        await setData(data as any);
        setResult('Success');
      } else if (command === 'getData') {
        const query =
          dataCategory === 'observation'
            ? { dataType: 'observation', date, observationType }
            : { dataType: 'symptom', date, symptomType };
        const res = await getData(query as any);
        setResult(res);
      } else if (command === 'getAllData') {
        const res = await getAllData({
          startDate,
          endDate,
          observationType: rangeObservationTypes.length ? rangeObservationTypes : undefined,
          symptomType: rangeSymptomTypes.length ? rangeSymptomTypes : undefined,
        });
        setResult(res);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="api-test">
      <h2 style={{ marginBottom: 16 }}>API Test Page</h2>
      <div className="api-test__section">
        <label style={{ fontWeight: 600 }}>Command</label>
        <select value={command} onChange={(e) => setCommand(e.target.value)}>
          {apiCommands.map((cmd) => (
            <option key={cmd.name} value={cmd.name}>
              {cmd.description}
            </option>
          ))}
        </select>
      </div>

      {(command === 'setData' || command === 'getData') && (
        <>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>Data category</label>
            <div className="api-test__inline-options">
              <label>
                <input
                  type="radio"
                  value="observation"
                  checked={dataCategory === 'observation'}
                  onChange={() => setDataCategory('observation')}
                />
                Observation
              </label>
              <label>
                <input
                  type="radio"
                  value="symptom"
                  checked={dataCategory === 'symptom'}
                  onChange={() => setDataCategory('symptom')}
                />
                Symptom
              </label>
            </div>
          </div>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {dataCategory === 'observation' ? (
            <div className="api-test__section">
              <label style={{ fontWeight: 600 }}>Observation type</label>
              <select value={observationType} onChange={(e) => setObservationType(e.target.value as ObservationType)}>
                {observationOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="api-test__section">
              <label style={{ fontWeight: 600 }}>Symptom type</label>
              <select value={symptomType} onChange={(e) => setSymptomType(e.target.value as SymptomType)}>
                {symptomOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {command === 'setData' && (
        <div className="api-test__section">
          <label style={{ fontWeight: 600 }}>Value</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      )}

      {command === 'getAllData' && (
        <>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>Observation types</label>
            <div className="api-test__inline-options">
              {observationOptions.map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={rangeObservationTypes.includes(type)}
                    onChange={() => toggleObservationFilter(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
            <small style={{ color: '#6b7280' }}>Leave empty to include all observation types.</small>
          </div>
          <div className="api-test__section">
            <label style={{ fontWeight: 600 }}>Symptom types</label>
            <div className="api-test__inline-options">
              {symptomOptions.map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={rangeSymptomTypes.includes(type)}
                    onChange={() => toggleSymptomFilter(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
            <small style={{ color: '#6b7280' }}>Leave empty to include all symptom types.</small>
          </div>
        </>
      )}

      <button onClick={handleRun} className="api-test__run">
        Run request
      </button>
      {error && <div className="api-test__error">{error}</div>}
      {result && (
        <pre className="api-test__result">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ApiTestPage;
