import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerPublic } from '../services/api';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({ 
    name: '', 
    firstName: '', 
    phone: '', 
    cin: '', 
    email: '', 
    password: '', 
    role: 'agent'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await registerPublic(formData);
      setMessage(res.data.message || 'Inscription réussie. Veuillez vérifier votre email.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <UserPlus size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
          <h2 className="auth-title">Inscription</h2>
          <p className="auth-subtitle">Créez votre compte SIG Routier</p>
        </div>

        {message && (
          <div style={{ padding: '12px', backgroundColor: '#d1fae5', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Nom</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Nom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="text"
                className="input-field"
                placeholder="Numéro de téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>CIN</label>
              <input
                type="text"
                className="input-field"
                placeholder="Numéro CIN"
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de Passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>


          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            S'inscrire
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Déjà inscrit ? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;