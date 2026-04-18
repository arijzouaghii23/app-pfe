import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'envoi de l'email");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="glass-panel auth-card" style={{ textAlign: 'center' }}>
                    <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                    <h2 className="auth-title">Email envoyé</h2>
                    <p className="auth-subtitle">
                        Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                        Veuillez consulter votre boîte de réception.
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', marginTop: '20px', textDecoration: 'none' }}>
                        Retour à la connexion
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
                    <h2 className="auth-title">Mot de passe oublié</h2>
                    <p className="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Adresse E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
