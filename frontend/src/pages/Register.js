import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerPublic } from '../services/api';
import { User, Mail, Lock } from 'lucide-react';
import AuthLayout from '../componets/AuthLayout';

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
        <AuthLayout>
            <div className="w-full flex flex-col items-center">
                <img src="/logoSIG.png" alt="RouteSignal Logo" className="h-12 w-auto mb-6 object-contain" />

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rejoindre la Patrouille</h2>
                    <p className="text-sm font-medium text-slate-500 mt-2">Créez votre accès agent pour débuter l'inspection technique du réseau routier.</p>
                </div>

                {message && (
                    <div className="w-full p-3 mb-6 bg-emerald-50 text-emerald-600 rounded-xl text-sm text-center font-medium border border-emerald-100">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="w-full p-3 mb-6 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nom</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                    placeholder="Votre nom"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Prénom</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                    placeholder="Votre prénom"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Téléphone</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="+212 6XX XXX XXX"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">CIN</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="Numéro CIN"
                                value={formData.cin}
                                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Adresse E-mail</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="agent@routesignal.ma"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
                        S'inscrire
                        <span className="text-lg leading-none">→</span>
                    </button>
                </form>

                <div className="mt-8 text-center flex flex-col items-center gap-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">OU</p>
                    <p className="text-sm font-medium text-slate-500">
                        Déjà inscrit ? <Link to="/login" className="text-blue-500 font-bold hover:text-blue-600 transition-colors">Se connecter</Link>
                    </p>
                </div>

                <div className="mt-8 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    © 2026 RouteSignal
                </div>
            </div>
        </AuthLayout>
    );
}

export default Register;