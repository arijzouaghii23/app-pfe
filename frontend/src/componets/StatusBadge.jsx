import React from 'react';

const StatusBadge = ({ status }) => {
  const isPending = status === 'pending';
  
  return (
    <span className={`status-badge ${isPending ? 'pending' : 'active'}`}>
      <span className={`badge-dot ${isPending ? 'pending' : 'active'}`}></span>
      {isPending ? 'En attente' : 'Actif'}
    </span>
  );
};

export default StatusBadge;
