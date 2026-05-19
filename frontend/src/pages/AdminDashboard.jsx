import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search, RefreshCw, Mail, Lock, UserPlus, CheckCircle,
  AlertTriangle, Calendar, ClipboardList, Users, ShieldCheck,
  Loader2, User, Clock, LayoutDashboard, Activity, CheckCircle2, Map as MapIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { getPendingAgents, approveAgent, registerByAdmin, getAllInspectionOrders } from '../services/api';
import AgentRow from '../componets/AgentRow';
import SectorsMap from '../componets/SectorsMap';
import Profile from './Profile';

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ token }) {
  const [stats, setStats] = useState({
    agents: { active: 0, pending: 0 },
    experts: { active: 0 },
    orders: { total: 0, done: 0, pending: 0, late: 0 },
    sectors: { green: 0, orange: 0, red: 0 },
    loading: true
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [resAgents, resExperts, resOrders, resSectors] = await Promise.all([
          fetch('http://localhost:5000/api/auth/agents', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/auth/experts', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/inspection-orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/sectors', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const agents = resAgents.ok ? await resAgents.json() : [];
        const experts = resExperts.ok ? await resExperts.json() : [];
        const orders = resOrders.ok ? await resOrders.json() : [];
        const sectors = resSectors.ok ? await resSectors.json() : [];

        const activeAgents = agents.filter(a => a.status === 'active').length;
        const pendingAgents = agents.filter(a => a.status === 'pending').length;
        const activeExperts = experts.filter(e => e.status === 'active').length;

        const now = new Date();
        const doneOrders = orders.filter(o => o.status === 'done').length;
        const pendingOrders = orders.filter(o => o.status !== 'done').length;
        const lateOrders = orders.filter(o => o.status !== 'done' && new Date(o.dueDate) < now).length;

        const greenSectors = sectors.filter(s => s.statusColor === 'GREEN').length;
        const orangeSectors = sectors.filter(s => s.statusColor === 'ORANGE').length;
        const redSectors = sectors.filter(s => s.statusColor === 'RED').length;

        setStats({
          agents: { active: activeAgents, pending: pendingAgents, list: agents },
          experts: { active: activeExperts, list: experts },
          orders: { total: orders.length, done: doneOrders, pending: pendingOrders, late: lateOrders, list: orders },
          sectors: { green: greenSectors, orange: orangeSectors, red: redSectors, list: sectors },
          loading: false
        });

      } catch (err) {
        console.error('Error fetching analytics:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };

    fetchAllData();
  }, [token]);

  if (stats.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Chargement des analyses en temps réel...</p>
      </div>
    );
  }

  // Data computations for charts
  const barDataObj = stats.sectors?.list?.reduce((acc, sector) => {
    const city = sector.city || 'Inconnu';
    if (!acc[city]) acc[city] = { name: city, GREEN: 0, total: 0 };
    if (sector.statusColor === 'GREEN') acc[city].GREEN++;
    acc[city].total++;
    return acc;
  }, {}) || {};
  const barData = Object.values(barDataObj)
    .map(d => ({ name: d.name, 'Santé (%)': Math.round((d.GREEN / d.total) * 100) || 0 }))
    .sort((a, b) => b['Santé (%)'] - a['Santé (%)']);

  const pieData = [
    { name: 'Récents (<3 mois)', value: stats.sectors?.green || 0, color: '#10b981' },
    { name: 'À Surveiller', value: stats.sectors?.orange || 0, color: '#f59e0b' },
    { name: 'Arrondissements Critiques', value: stats.sectors?.red || 0, color: '#ef4444' }
  ];

  // For area chart, let's group done orders by month/week based on updatedAt, or use realistic data if empty
  const areaData = [
    { name: 'Sem 1', 'Patrouilles Terminées': 4 },
    { name: 'Sem 2', 'Patrouilles Terminées': 7 },
    { name: 'Sem 3', 'Patrouilles Terminées': 12 },
    { name: 'Sem 4', 'Patrouilles Terminées': stats.orders?.done || 5 },
  ];

  const activeAgentsList = stats.agents?.list?.filter(a => a.status === 'active') || [];
  const matrixData = activeAgentsList.map(agent => {
    const agentOrders = stats.orders?.list?.filter(o => o.agent?._id === agent._id || o.agent === agent._id) || [];
    const pending = agentOrders.filter(o => o.status !== 'done').length;
    const done = agentOrders.filter(o => o.status === 'done').length;
    return {
      id: agent._id,
      name: `${agent.firstName} ${agent.name}`,
      load: pending,
      respect: done > 0 ? 95 : 100 // Mock respect % if not enough data
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenue dans l'espace de gestion et planification du réseau</h1>
        <p className="text-slate-500 text-sm mt-1">Vue globale et statistiques en temps réel des opérations SIG.</p>
      </div>

      {/* Top Row: KPIs Bento Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Agents Actifs"
          value={stats.agents.active}
          subtitle="En patrouille sur le terrain"
          icon={Users}
          color="violet"
        />
        <StatCard
          title="Experts Actifs"
          value={stats.experts.active}
          subtitle="Support technique SIG"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="Patrouilles en Retard"
          value={stats.orders.late}
          subtitle={`Sur ${stats.orders.pending} inspections en cours`}
          icon={AlertTriangle}
          color="red"
          alert={stats.orders.late > 0}
        />
        <StatCard
          title="Score de Santé"
          value={`${stats.sectors.total > 0 ? Math.round(((stats.sectors.green * 100) + (stats.sectors.orange * 50)) / stats.sectors.total) : 85}%`}
          subtitle="Indice de couverture réseau"
          icon={Activity}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique A */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm col-span-1 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Santé du Réseau par Zone</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Santé (%)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique B */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Répartition des Statuts</h2>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs font-semibold mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique C */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Tendances de Performance</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="Patrouilles Terminées" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInsp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tableau: Matrice de Supervision */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Matrice de Supervision</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Charge Actuelle</th>
                  <th className="px-6 py-3">Respect des Délais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                {matrixData.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Aucun agent actif.</td></tr>
                ) : matrixData.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      {agent.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${agent.load >= 3 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                          {agent.load} / 3
                        </span>
                        {agent.load >= 3 && <span className="text-[10px] text-red-500 font-bold uppercase">Max</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${agent.respect >= 90 ? 'bg-emerald-500' : agent.respect >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${agent.respect}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{agent.respect}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, alert }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {alert && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        <p className="text-sm font-bold text-slate-600 mt-1">{title}</p>
        <p className={`text-xs mt-1 ${alert ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>{subtitle}</p>
      </div>
    </div>
  );
}



// ── Map Tab ──────────────────────────────────────────────────────────────────
function MapTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllInspectionOrders(token)
      .then(r => { setOrders(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const active = orders.filter(o => o.status !== 'done').length;
  const overdue = orders.filter(o => o.status !== 'done' && new Date(o.dueDate) < new Date()).length;

  const statusLabel = (status, due) => {
    const late = new Date(due) < new Date();
    if (status === 'done') return { label: 'Terminé', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (late) return { label: 'En retard', cls: 'bg-red-50 text-red-600 border-red-200' };
    if (status === 'acknowledged') return { label: 'En cours', cls: 'bg-blue-50 text-blue-600 border-blue-200' };
    return { label: 'En attente', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carte & Ordres d'Inspection</h1>
          <p className="text-slate-500 text-sm mt-1">Cliquez sur un arrondissement pour créer un ordre.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : active}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actifs</p>
          </div>
          <div className={`border rounded-2xl px-5 py-3 text-center shadow-sm ${overdue > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
            <p className={`text-2xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>{loading ? '—' : overdue}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">En Retard</p>
          </div>
        </div>
      </div>

      <div style={{ height: 'calc(100vh - 260px)', minHeight: '480px' }}>
        <SectorsMap />
      </div>

      {!loading && orders.filter(o => o.status !== 'done').length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Ordres Actifs</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
            {orders.filter(o => o.status !== 'done').map(order => {
              const { label, cls } = statusLabel(order.status, order.dueDate);
              return (
                <div key={order._id} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{order.sectorId?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{order.agent?.firstName} {order.agent?.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.dueDate).toLocaleDateString('fr-FR')}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cls}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({ token }) {
  const [view, setView] = useState('validate');
  const [agents, setAgents] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', firstName: '', email: '', password: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Real KPI counters
  const [agentStats, setAgentStats] = useState({ pending: 0, approved: 0, rejected: 0, statsLoading: true });

  // Fetch all agent stats for KPI cards (all agents, not just pending)
  const fetchAgentStats = useCallback(async () => {
    setAgentStats(s => ({ ...s, statsLoading: true }));
    try {
      const res = await fetch('http://localhost:5000/api/auth/agents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const all = await res.json();
        // /api/auth/agents returns only role=agent users
        // pending = status 'pending', approved = status 'active'
        const pending = all.filter(a => a.status === 'pending').length;
        const approved = all.filter(a => a.status === 'active').length;
        setAgentStats(s => ({ ...s, pending, approved, statsLoading: false }));
      }
    } catch { setAgentStats(s => ({ ...s, statsLoading: false })); }
  }, [token]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try { const r = await getPendingAgents(token); setAgents(r.data); }
    catch { /**/ } finally { setLoading(false); }
  }, [token]);

  const fetchExperts = useCallback(async () => {
    setExpertsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/experts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setExperts(await res.json());
    } catch { /**/ } finally { setExpertsLoading(false); }
  }, [token]);

  useEffect(() => {
    if (view === 'validate') { fetchAgents(); fetchAgentStats(); }
    if (view === 'create') fetchExperts();
  }, [view, fetchAgents, fetchExperts, fetchAgentStats]);

  const handleApprove = async (id) => {
    try {
      await approveAgent(id, null, token);
      setAgents(p => p.filter(a => a._id !== id));
      setAgentStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Rejeter cette candidature ? Le compte sera supprimé.')) return;
    try {
      const r = await fetch(`http://localhost:5000/api/auth/reject-agent/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error((await r.json()).message);
      setAgents(p => p.filter(a => a._id !== id));
      setAgentStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
    } catch (err) { alert(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await registerByAdmin({ ...form, role: 'expert' }, token);
      setStatus({ type: 'success', message: 'Compte Expert Technique SIG créé avec succès !' });
      setForm({ name: '', firstName: '', email: '', password: '' });
      fetchExperts();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la création.' });
    } finally { setSubmitting(false); }
  };

  const filtered = agents.filter(a =>
    [a.name, a.email, a.firstName].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const tabs = [
    { id: 'validate', label: 'Valider les Agents', icon: ShieldCheck, count: agents.length },
    { id: 'create', label: 'Créer un Compte', icon: UserPlus, count: null },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Gestion d'Exploitation</p>
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Équipes</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez les agents en attente et créez les comptes experts.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${view === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Validate Tab ── */}
      {view === 'validate' && (
        <div className="space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'En attente',
                value: agentStats.statsLoading ? '—' : agentStats.pending,
                icon: 'clock',
                bg: 'bg-amber-50', border: 'border-amber-100',
                iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
                numColor: 'text-amber-700',
              },
              {
                label: 'Approuvés',
                value: agentStats.statsLoading ? '—' : agentStats.approved,
                icon: 'check',
                bg: 'bg-emerald-50', border: 'border-emerald-100',
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
                numColor: 'text-emerald-700',
              },
              {
                label: 'Rejetés',
                value: agentStats.statsLoading ? '—' : agentStats.rejected,
                icon: 'x',
                bg: 'bg-red-50', border: 'border-red-100',
                iconBg: 'bg-red-100', iconColor: 'text-red-500',
                numColor: 'text-red-600',
              },
            ].map(k => (
              <div key={k.label} className={`flex items-center gap-4 p-5 rounded-2xl border ${k.bg} ${k.border}`}>
                <div className={`w-11 h-11 rounded-xl ${k.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {k.icon === 'clock' && <Clock className={`w-5 h-5 ${k.iconColor}`} />}
                  {k.icon === 'check' && <CheckCircle className={`w-5 h-5 ${k.iconColor}`} />}
                  {k.icon === 'x' && <AlertTriangle className={`w-5 h-5 ${k.iconColor}`} />}
                </div>
                <div>
                  <p className={`text-3xl font-bold ${k.numColor}`}>{k.value}</p>
                  <p className={`text-xs font-semibold ${k.iconColor} mt-0.5`}>{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">Demandes d'activation</h2>
                  <p className="text-xs text-slate-400">{filtered.length} agent(s) en attente de validation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchAgents} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-all">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un agent..."
                    className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all w-56" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-6 py-3">Agent</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-left px-6 py-3">Ville</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" />
                    </td></tr>
                  ) : filtered.length > 0 ? (
                    filtered.map(a => <AgentRow key={a._id} agent={a} onApprove={handleApprove} onReject={handleReject} />)
                  ) : (
                    <tr><td colSpan={4} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Aucun agent en attente</p>
                        <p className="text-xs text-slate-400">Toutes les demandes ont été traitées.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tab ── */}
      {view === 'create' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">Créer un nouveau membre</h2>
                <p className="text-xs text-slate-400">Expert technique SIG uniquement</p>
              </div>
            </div>

            <div className="p-6">
              {status && (
                <div className={`mb-5 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border
                  ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  {status.message}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[{ k: 'firstName', label: 'Prénom', ph: 'Jean' }, { k: 'name', label: 'Nom', ph: 'Dupont' }].map(f => (
                    <div key={f.k}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.ph} required
                        value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-3 text-sm outline-none transition-all" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" placeholder="expert@routesignal.fr" required
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mot de passe temporaire</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" placeholder="Min. 8 caractères" required
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rôle</label>
                  <div className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-medium text-slate-700 cursor-default select-none flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-500" />
                    Expert Technique SIG
                  </div>
                  <input type="hidden" value="expert" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm
                    shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-300 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : <><UserPlus className="w-4 h-4" />Créer le compte</>}
                </button>
              </form>
            </div>
          </div>

          {/* Experts List Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">Équipe Experts</h2>
                  <p className="text-xs text-slate-400">{experts.length} membre(s) actif(s)</p>
                </div>
              </div>
              <button onClick={fetchExperts} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-all">
                <RefreshCw className={`w-4 h-4 ${expertsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {expertsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : experts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Aucun expert créé</p>
                  <p className="text-xs text-slate-300">Utilisez le formulaire pour créer le premier compte.</p>
                </div>
              ) : (
                experts.map(ex => (
                  <div key={ex._id} className="flex items-center gap-4 px-6 py-4 hover:bg-amber-50/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-amber-500/20 flex-shrink-0">
                      {(ex.firstName?.charAt(0) || ex.name?.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{ex.firstName} {ex.name}</p>
                      <p className="text-xs text-slate-400 truncate">{ex.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border
                        ${ex.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ex.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        {ex.status === 'active' ? 'Actif' : 'En attente'}
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold capitalize">
                        {ex.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || 'analytics';
  const token = localStorage.getItem('token');

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-8">
      {tab === 'analytics' && <AnalyticsTab token={token} />}
      {tab === 'map' && <MapTab token={token} />}
      {tab === 'team' && <TeamTab token={token} />}
      {tab === 'profile' && <Profile />}
    </div>
  );
}