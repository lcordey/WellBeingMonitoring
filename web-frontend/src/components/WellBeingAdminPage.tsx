import React, { useEffect, useState } from 'react';

// WellBeingDefinition interface for backend response
interface WellBeingValueDefinition {
  value: string;
  notable: boolean;
}

interface WellBeingDefinition {
  Category: string;
  Type: string;
  Values: WellBeingValueDefinition[];
  AllowMultiple: boolean;
}

export const WellBeingAdminPage: React.FC = () => {
  const [observationTypes, setObservationTypes] = useState<WellBeingDefinition[]>([]);
  const [symptomTypes, setSymptomTypes] = useState<WellBeingDefinition[]>([]);
  const [newType, setNewType] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('observation');
  const [newTypeMultiple, setNewTypeMultiple] = useState(false);
  const [deleteTypeCategory, setDeleteTypeCategory] = useState('observation');
  const [deleteType, setDeleteType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newValueNotable, setNewValueNotable] = useState(false);
  const [deleteValue, setDeleteValue] = useState('');
  const [wellBeingData, setWellBeingData] = useState({ type: '', value: '', date: '' });
  const [message, setMessage] = useState('');

  // Fetch observation types
  const fetchObservationTypes = async () => {
    const res = await fetch('http://localhost:5000/command/getWBDefinitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'observation' })
    });
    const data = await res.json();
    setObservationTypes(data || []);
  };

  // Fetch symptom types
  const fetchSymptomTypes = async () => {
    const res = await fetch('http://localhost:5000/command/getWBDefinitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'symptom' })
    });
    const data = await res.json();
    setSymptomTypes(data || []);
  };

  useEffect(() => {
    fetchObservationTypes();
    fetchSymptomTypes();
  }, []);

  // Create type
  const handleCreateType = async () => {
    setMessage('');
    await fetch('http://localhost:5000/command/createWBType', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newType,
        category: newTypeCategory,
        allowMultipleSelection: newTypeMultiple
      })
    });
    setNewType('');
    setNewTypeMultiple(false);
    fetchObservationTypes();
    fetchSymptomTypes();
    setMessage('Type created');
  };

  // Delete type
  const handleDeleteType = async () => {
    setMessage('');
    await fetch('http://localhost:5000/command/deleteWBType', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: deleteType,
        category: deleteTypeCategory
      })
    });
    setDeleteType('');
    fetchObservationTypes();
    fetchSymptomTypes();
    setMessage('Type deleted');
  };

  // Add value
  const handleAddValue = async () => {
    setMessage('');
    await fetch('http://localhost:5000/command/addWBValue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: selectedType, value: newValue, notable: newValueNotable })
    });
    setNewValue('');
    setNewValueNotable(false);
    fetchObservationTypes();
    fetchSymptomTypes();
    setMessage('Value added');
  };

  // Delete value
  const handleDeleteValue = async () => {
    setMessage('');
    await fetch('http://localhost:5000/command/deleteWBValue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: selectedType, value: deleteValue })
    });
    setDeleteValue('');
    fetchObservationTypes();
    fetchSymptomTypes();
    setMessage('Value deleted');
  };

  // Add well-being data
  const handleAddData = async () => {
    setMessage('');
    await fetch('http://localhost:5000/command/addWBData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: wellBeingData.type, value: wellBeingData.value, date: wellBeingData.date })
    });
    setWellBeingData({ type: '', value: '', date: '' });
    setMessage('Data added');
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'left' }}>
      <h2>Well-Being Admin</h2>
      {message && <div style={{ color: 'green', marginBottom: 10 }}>{message}</div>}
      <section style={{ marginBottom: 32 }}>
        <h3>Create Well-Being Type</h3>
        <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="Type name" />
        <select value={newTypeCategory} onChange={e => setNewTypeCategory(e.target.value)}>
          <option value="observation">Observation</option>
          <option value="symptom">Symptom</option>
        </select>
        <label style={{ marginLeft: 8 }}>
          <input type="checkbox" checked={newTypeMultiple} onChange={e => setNewTypeMultiple(e.target.checked)} /> Multiple options possible
        </label>
        <button onClick={handleCreateType} disabled={!newType}>Create</button>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h3>Delete Well-Being Type</h3>
        <select value={deleteTypeCategory} onChange={e => setDeleteTypeCategory(e.target.value)}>
          <option value="observation">Observation</option>
          <option value="symptom">Symptom</option>
        </select>
        <select value={deleteType} onChange={e => setDeleteType(e.target.value)}>
          <option value="">Select type</option>
          {(deleteTypeCategory === 'observation' ? observationTypes : symptomTypes).map((t, idx) => (
            <option key={deleteTypeCategory + '-' + t.Type + '-' + idx} value={t.Type}>{t.Type}</option>
          ))}
        </select>
        <button onClick={handleDeleteType} disabled={!deleteType}>Delete</button>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h3>Add Value to Type</h3>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
          <option value="">Select type</option>
          {observationTypes.concat(symptomTypes).map(t => <option key={t.Type} value={t.Type}>{t.Type}</option>)}
        </select>
        <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value" />
        <label style={{ marginLeft: 8 }}>
          <input type="checkbox" checked={newValueNotable} onChange={e => setNewValueNotable(e.target.checked)} /> Notable
        </label>
        <button onClick={handleAddValue} disabled={!selectedType || !newValue}>Add</button>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h3>Remove Value from Type</h3>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
          <option value="">Select type</option>
          {observationTypes.concat(symptomTypes).map(t => <option key={t.Type} value={t.Type}>{t.Type}</option>)}
        </select>
        <select value={deleteValue} onChange={e => setDeleteValue(e.target.value)}>
          <option value="">Select value</option>
          {([...(observationTypes || []), ...(symptomTypes || [])].find(t => t.Type === selectedType)?.Values || []).map(v => (
            <option key={v.value} value={v.value}>{v.value}</option>
          ))}
        </select>
        <button onClick={handleDeleteValue} disabled={!selectedType || !deleteValue}>Remove</button>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h3>All Well-Being Types</h3>
        <ul>
          {[...observationTypes, ...symptomTypes].map(t => (
            <li key={t.Type}>
              <b>{t.Type}</b>
              <ul>
              {t.Values?.map(v => (
                <li key={v.value}>
                    {v.value} {v.notable && <span style={{ color: 'purple' }}>(notable)</span>}
                </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h3>Add Well-Being Data</h3>
        <select value={wellBeingData.type} onChange={e => setWellBeingData(d => ({ ...d, type: e.target.value }))}>
          <option value="">Select type</option>
          {observationTypes.concat(symptomTypes).map(t => <option key={t.Type} value={t.Type}>{t.Type}</option>)}
        </select>
        <select value={wellBeingData.value} onChange={e => setWellBeingData(d => ({ ...d, value: e.target.value }))}>
          <option value="">Select value</option>
          {([...(observationTypes || []), ...(symptomTypes || [])].find(t => t.Type === wellBeingData.type)?.Values || []).map(v => (
            <option key={v.value} value={v.value}>{v.value}</option>
          ))}
        </select>
        <input type="date" value={wellBeingData.date} onChange={e => setWellBeingData(d => ({ ...d, date: e.target.value }))} />
        <button onClick={handleAddData} disabled={!wellBeingData.type || !wellBeingData.value || !wellBeingData.date}>Add Data</button>
      </section>
    </div>
  );
};
