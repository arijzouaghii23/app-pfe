import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);
        setError('');
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la réinitialisation");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="glass-panel auth-card" style={{ textAlign: 'center' }}>
                    <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                    <h2 className="auth-title">Mot de passe réinitialisé</h2>
                    <p className="auth-subtitle">
                        Votre mot de passe a été mis à jour avec succès.
                        Vous allez être redirigé vers la page de connexion...
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', marginTop: '20px', textDecoration: 'none' }}>
                        Connexion immédiate
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
                    <h2 className="auth-title">Nouveau mot de passe</h2>
                    <p className="auth-subtitle">Définissez votre nouveau mot de passe sécurisé</p>
                </div>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nouveau mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                        {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
