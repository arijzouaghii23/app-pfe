import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '../componets/AuthLayout';

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
                    navigate('/map');
                }
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion');
        }
    };

    return (
        <AuthLayout>
            <div className="w-full flex flex-col items-center">
                <img src="/logoSIG.png" alt="RouteSignal Logo" className="h-12 w-auto mb-6 object-contain" />

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Terminal de Gestion</h2>
                    <p className="text-sm font-medium text-slate-500 mt-2">Connectez-vous pour accéder au centre de commande RouteSignal.</p>
                </div>

                {error && (
                    <div className="w-full p-3 mb-6 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium border border-red-100">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="w-full p-3 mb-6 bg-emerald-50 text-emerald-600 rounded-xl text-sm text-center font-medium border border-emerald-100">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="w-full space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Adresse E-mail</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="admin@routesignal.ma"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mot de Passe</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
                        Se Connecter
                        <span className="text-lg leading-none">→</span>
                    </button>
                </form>

                <div className="mt-8 text-center flex flex-col items-center gap-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">OU</p>
                    <p className="text-sm font-medium text-slate-500">
                        Nouvel agent ? <Link to="/register" className="text-blue-500 font-bold hover:text-blue-600 transition-colors">Créer un accès</Link>
                    </p>
                </div>

                <div className="mt-12 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    © 2026 RouteSignal — Plateforme de gestion routière
                </div>
            </div>
        </AuthLayout>
    );
}

export default Login;