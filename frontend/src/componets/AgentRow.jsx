import React, { useState, useEffect } from 'react';
import { Check, Edit, MapPin, X, Save } from 'lucide-react';
import StatusBadge from './StatusBadge';

const AgentRow = ({ agent, onApprove, sectors = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCity, setSelectedCity] = useState(agent.assignedCity || '');

  useEffect(() => {
    if (sectors && sectors.length > 0 && !selectedCity) {
      setSelectedCity(agent.assignedCity || sectors[0].name);
    }
  }, [sectors, agent.assignedCity, selectedCity]);

  // Approbation directe avec la ville par défaut
  const handleApprove = () => {
    onApprove(agent._id, selectedCity);
  };

  // Approbation après modification de la ville
  const handleUpdateAndApprove = (e) => {
    e.preventDefault();
    onApprove(agent._id, selectedCity);
    setIsEditing(false);
  };

  return (
    <tr>
      {/* Identité */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            height: '40px', width: '40px', borderRadius: '50%',
            backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#64748b', fontWeight: 'bold',
            border: '1px solid #e2e8f0', marginRight: '12px'
          }}>
            {agent.name?.charAt(0)}{agent.firstName?.charAt(0) || ''}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
              {agent.firstName} {agent.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{agent.email}</div>
          </div>
        </div>
      </td>

      {/* Statut */}
      <td><StatusBadge status={agent.status} /></td>

      {/* Ville assignée */}
      <td>
        {isEditing ? (
          <form onSubmit={handleUpdateAndApprove} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                autoFocus
                className="input-field"
                style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.875rem', appearance: 'auto', cursor: 'pointer' }}
              >
                {sectors.map(sector => (
                  <option key={sector._id} value={sector.name}>{sector.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-success" style={{ padding: '6px' }} title="Valider">
              <Save size={18} />
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn" style={{ padding: '6px', backgroundColor: '#f1f5f9' }} title="Annuler">
              <X size={18} />
            </button>
          </form>
        ) : (
          <div className="flex-center" style={{ fontSize: '0.875rem', color: '#475569' }}>
            <MapPin size={14} style={{ marginRight: '8px', color: '#94a3b8' }} />
            {agent.assignedCity || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Non assignée</span>}
          </div>
        )}
      </td>

      {/* Actions */}
      <td style={{ textAlign: 'right' }}>
        {!isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={handleApprove}
              className="btn btn-success"
              style={{ padding: '8px 12px' }}
            >
              <Check size={16} style={{ marginRight: '6px' }} />
              Approuver ({selectedCity})
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="btn"
              style={{ border: '1px solid #e2e8f0', backgroundColor: 'white', padding: '8px 12px' }}
            >
              <Edit size={16} style={{ marginRight: '6px' }} />
              Changer ville
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default AgentRow;
