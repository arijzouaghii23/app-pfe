import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, MapPin } from 'lucide-react';
import { getUserStatus } from '../services/api';

const WaitPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const response = await getUserStatus(token);
        if (response.data.status === 'active') {
          // Mettre à jour l'utilisateur local
          const updatedUser = { ...user, status: 'active' };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Redirection vers le dashboard approprié
          if (response.data.role === 'admin') navigate('/admin');
          else if (response.data.role === 'expert') navigate('/expert');
          else if (response.data.role === 'agent') navigate('/agent');
          else navigate('/map');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut:", error);
      }
    }, 30000); // Polling toutes les 30 secondes

    return () => clearInterval(interval);
  }, [token, navigate, user]);

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card" style={{ textAlign: 'center' }}>
        
        {/* Icône d'attente stylisée */}
        <div className="flex justify-center mb-8" style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div className="relative inline-flex" style={{ position: 'relative', display: 'inline-flex' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '9999px', backgroundColor: '#e0f2fe', opacity: 0.5 }}></div>
            <div style={{ position: 'relative', backgroundColor: '#f0f9ff', padding: '24px', borderRadius: '9999px' }}>
              <Clock className="w-12 h-12" size={48} color="var(--primary)" />
              <MapPin size={24} color="var(--primary)" style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
        </div>

        <h1 className="auth-title">
          Vérification de votre compte
        </h1>
        
        <p className="auth-subtitle">
          Ravi de vous revoir, <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{user.firstName || user.name || 'Agent'}</span>. 
          <br />Votre e-mail a été validé. Un administrateur examine actuellement votre demande pour la zone 
          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}> {user.zone && user.zone.length > 0 ? (Array.isArray(user.zone) ? user.zone.join(', ') : user.zone) : 'Non spécifiée'}</span>.
        </p>

        <div className="card" style={{ textAlign: 'left', marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flexShrink: 0, width: '4px', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Note de l'administration :</span> Cette étape de sécurité est obligatoire pour accéder aux outils de terrain. Elle est généralement finalisée sous 24 heures.
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          <LogOut size={20} />
          Se déconnecter de la session
        </button>

        <p style={{ marginTop: '30px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
          Système d'Information Géographique Routier
        </p>
      </div>
    </div>
  );
};

export default WaitPage;
