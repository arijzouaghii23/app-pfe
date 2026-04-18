import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { Lock, ShieldAlert, Phone, CreditCard } from 'lucide-react';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
        phone: '',
        cin: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        if (!formData.phone || !formData.cin) {
            setError('Veuillez remplir toutes les informations (Téléphone et CIN).');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch('/api/auth/change-password',
                { 
                    newPassword: formData.newPassword,
                    phone: formData.phone,
                    cin: formData.cin
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local storage user info
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setMessage('Compte activé avec succès ! Redirection vers votre tableau de bord...');

            setTimeout(() => {
                const role = res.data.user.role;
                navigate(`/${role}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <ShieldAlert size={48} color="var(--secondary)" style={{ margin: '0 auto' }} />
                    <h2 className="auth-title">Activation du compte</h2>
                    <p className="auth-subtitle">Complétez votre profil et sécurisez votre compte pour continuer.</p>
                </div>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{ padding: '12px', backgroundColor: '#e0ffe8', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Numéro de Téléphone</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="ex: 21 000 000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Numéro CIN</label>
                        <div style={{ position: 'relative' }}>
                            <CreditCard size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Numéro CIN"
                                value={formData.cin}
                                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nouveau mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Nouveau mot de passe"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Confirmer mot de passe"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Activer mon compte
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;

