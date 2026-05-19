import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, FileText, CheckCircle, Clock, ClipboardCheck, Layers, TrendingUp, Inbox } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const authFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    ...opts,
    headers: { Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
  return res;
};

const ExpertDashboard = () => {
    const [reports, setReports] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsRes, missionsRes] = await Promise.all([
                authFetch('/api/reports'),
                authFetch('/api/missions/all')
            ]);
            
            if (reportsRes.ok) setReports(await reportsRes.json());
            if (missionsRes.ok) setMissions(await missionsRes.json());
        } catch (err) {
            console.error("Erreur de chargement:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
        );
    }

    // Calcul des KPIs
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'PENDING_EXPERT').length;
    const pretsAffectation = reports.filter(r => r.status === 'VALIDATED').length;
    
    // Nouveaux KPIs (depuis profil)
    const validations = reports.filter(r => ['VALIDATED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status)).length;
    const missionsCreated = missions.length;
    const missionsCompleted = missions.filter(m => m.status === 'COMPLETED').length;
    const closureRate = missionsCreated > 0 ? Math.round((missionsCompleted / missionsCreated) * 100) : 0;

    const citizenReportsCount = reports.filter(r => r.source === 'citizen').length;
    const agentReportsCount = reports.filter(r => r.source === 'agent').length;

    // Données pour le Donut Chart (Source)
    const sourceData = [
        { name: 'Citoyens', value: citizenReportsCount },
        { name: 'Agents', value: agentReportsCount }
    ];
    const COLORS = ['#3b82f6', '#10b981']; // Bleu pour Citoyens, Vert pour Agents

    // Calcul pour le Bar Chart (Répartition des statuts)
    const statusCounts = {
        'En attente': 0,
        'Validé': 0,
        'En cours': 0,
        'Terminé': 0,
        'Rejeté': 0
    };

    reports.forEach(r => {
        if (r.status === 'PENDING_EXPERT') statusCounts['En attente']++;
        else if (r.status === 'VALIDATED') statusCounts['Validé']++;
        else if (r.status === 'IN_PROGRESS') statusCounts['En cours']++;
        else if (r.status === 'COMPLETED') statusCounts['Terminé']++;
        else if (r.status === 'REJECTED') statusCounts['Rejeté']++;
    });

    const statusData = ['En attente', 'Validé', 'En cours', 'Terminé'].map(key => ({
        name: key,
        Total: statusCounts[key]
    }));

    // Couleurs sémantiques pour les barres
    const getBarColor = (name) => {
        switch (name) {
            case 'En attente': return '#eab308'; // Jaune
            case 'Validé': return '#3b82f6'; // Bleu
            case 'En cours': return '#f97316'; // Orange
            case 'Terminé': return '#10b981'; // Vert
            case 'Rejeté': return '#ef4444'; // Rouge
            default: return '#9ca3af';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                
                {/* Header */}
                <div>
                    <p className="text-sm font-bold text-amber-600 tracking-wider uppercase mb-1">ANALYTIQUES</p>
                    <h1 className="text-3xl font-black text-slate-900">Tableau de Bord Expert</h1>
                    <p className="text-slate-500 mt-2">Vue d'ensemble et statistiques des signalements et missions d'expertise.</p>
                </div>

                {/* Section : Statistiques Globales (Les Nouvelles Stats du Profil) */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Performances d'Expertise</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Validations effectuées */}
                        <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <ClipboardCheck className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Validations</p>
                                <p className="text-2xl font-bold text-slate-900 mt-0.5">{validations}</p>
                                <p className="text-xs text-slate-500">Rapports expertisés</p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(validations, 100)}%` }} />
                            </div>
                        </div>

                        {/* Missions créées / affectées */}
                        <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Layers className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Missions</p>
                                <p className="text-2xl font-bold text-slate-900 mt-0.5">{missionsCreated}</p>
                                <p className="text-xs text-slate-500">Créées & affectées</p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((missionsCreated / 50) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {/* Taux de clôture des missions */}
                        <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Taux de Clôture</p>
                                <p className="text-2xl font-bold text-slate-900 mt-0.5">{closureRate}%</p>
                                <p className="text-xs text-slate-500">Missions terminées</p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${closureRate}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section : Suivi des Rapports */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Suivi des Signalements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                                <FileText size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Total Signalements</p>
                                <h2 className="text-2xl font-black text-slate-800">{totalReports}</h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">En Attente</p>
                                <h2 className="text-2xl font-black text-slate-800">{pendingReports}</h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                                <Inbox size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Prêts pour affectation</p>
                                <h2 className="text-2xl font-black text-slate-800">{pretsAffectation}</h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                                <CheckCircle size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Missions Terminées</p>
                                <h2 className="text-2xl font-black text-slate-800">{missionsCompleted}</h2>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Section : Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Donut Chart: Source */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-md font-bold text-slate-800 mb-4">Source des Signalements</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: Statuts */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-md font-bold text-slate-800 mb-4">Répartition par Statut</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="Total" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExpertDashboard;
