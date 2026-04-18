import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('verified') === 'true') {
            setSuccessMsg('Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.');
        } else if (queryParams.get('verified') === 'false') {
            setError('Le lien de vérification est invalide ou expiré.');
        }
    }, [location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            const role = response.data.user.role;
            const status = response.data.user.status;

            if (role === 'admin') navigate('/admin');
            else if (role === 'expert') navigate('/expert');
            else if (role === 'citizen') navigate('/citizen');
            else if (role === 'agent') {
                if (status === 'pending') {
                    navigate('/wait'); // Redirection vers WaitPage si en attente
                } else {
                    navigate('/agent');
                }
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion');
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
                    <h2 className="auth-title">SIG Routier</h2>
                    <p className="auth-subtitle">Espace d'Authentification Sécurisé</p>
                </div>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '12px', backgroundColor: '#e0ffe8', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Adresse E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="expert@sig-routier.fr"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Se Connecter
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            Mot de passe oublié ?
                        </Link>
                    </div>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Créer un compte</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;