import React from 'react';
import { Check, MapPin, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const AgentRow = ({ agent, onApprove, onReject, sectors = [] }) => {
  // Approbation directe sans popup
  const handleApprove = () => {
    // Si agent.assignedCity est vide, l'AdminDashboard (handleApprove) utilisera sectors[0]
    onApprove(agent._id, agent.assignedCity || null);
  };

  const handleReject = () => {
    if (onReject) onReject(agent._id);
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
        <div className="flex-center" style={{ fontSize: '0.875rem', color: '#475569' }}>
          <MapPin size={14} style={{ marginRight: '8px', color: '#94a3b8' }} />
          {agent.assignedCity || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Affectation automatique en cours</span>}
        </div>
      </td>

      {/* Actions */}
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={handleApprove}
            className="btn btn-success"
            style={{ padding: '8px 12px' }}
            title="Approuver l'Agent"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleReject}
            className="btn"
            style={{ border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#ef4444', padding: '8px 12px' }}
            title="Rejeter et Supprimer"
          >
            <XCircle size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AgentRow;
