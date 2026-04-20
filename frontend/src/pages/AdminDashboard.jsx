import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, Users, LogOut, Shield, UserPlus,
  Search, RefreshCw, Mail, Lock, ClipboardList,
  CheckCircle, AlertTriangle, Calendar
} from 'lucide-react';
import { getPendingAgents, approveAgent, registerByAdmin, getAllInspectionOrders } from '../services/api';
import AgentRow from '../componets/AgentRow';
import SectorsMap from '../componets/SectorsMap';

// ── Sidebar Premium ──────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, userName }) {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'map', label: "Carte & Ordres d'Inspection", icon: Map, desc: 'Patrouilles SIG' },
    { id: 'team', label: 'Gestion de l\'équipe', icon: Users, desc: 'Agents & Experts' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 shadow-2xl flex flex-col z-50">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight">SIG Routier</p>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest px-3 mb-3">Navigation</p>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 relative
                ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                ${isActive
                  ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white'
                  : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-black">{(userName || 'A')[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate">{userName || 'Administrateur'}</p>
            <p className="text-slate-500 text-[10px]">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <LogOut size={14} />
          </div>
          <span className="text-xs font-bold">Se Déconnecter</span>
        </button>
      </div>
    </aside>
  );
}

// ── Carte & Missions (plein écran) ───────────────────────────────────────────
function MapTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    getAllInspectionOrders(token)
      .then(res => { setOrders(res.data || []); setLoadingOrders(false); })
      .catch(() => setLoadingOrders(false));
  }, [token]);

  const active = orders.filter(o => o.status !== 'done').length;
  const overdue = orders.filter(o => o.status !== 'done' && new Date(o.dueDate) < new Date()).length;

  const getStatusStyle = (status, dueDate) => {
    const late = new Date(dueDate) < new Date();
    if (status === 'done') return 'bg-slate-100 text-slate-500 border-slate-200';
    if (late && status === 'pending') return 'bg-red-50 text-red-600 border-red-200';
    if (late && status === 'acknowledged') return 'bg-orange-50 text-orange-600 border-orange-200';
    if (status === 'acknowledged') return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };
  const getStatusLabel = (status, dueDate) => {
    const late = new Date(dueDate) < new Date();
    if (status === 'done') return 'Terminé';
    if (late && status === 'pending') return <span className="flex items-center gap-1"><AlertTriangle size={12} /> Retard critique</span>;
    if (late && status === 'acknowledged') return 'En souffrance';
    if (status === 'acknowledged') return 'En cours';
    return 'En attente';
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header + KPIs compacts */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Carte & Ordres d'Inspection</h1>
          <p className="text-slate-400 text-sm mt-0.5">Cliquez sur un arrondissement pour créer un ordre. Les couleurs indiquent l'obsolescence.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-800">{loadingOrders ? '—' : active}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actifs</p>
          </div>
          <div className={`border rounded-2xl px-5 py-3 text-center shadow-sm ${overdue > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
            <p className={`text-2xl font-black ${overdue > 0 ? 'text-red-600' : 'text-slate-800'}`}>{loadingOrders ? '—' : overdue}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Retard</p>
          </div>
        </div>
      </div>

      {/* Carte SIG plein écran */}
      <div style={{ height: 'calc(100vh - 260px)', minHeight: '480px' }}>
        <SectorsMap />
      </div>

      {/* Suivi des ordres actifs — liste compacte */}
      {!loadingOrders && orders.filter(o => o.status !== 'done').length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList size={15} className="text-indigo-500" />
            <h2 className="font-black text-slate-700 text-sm">Ordres Actifs</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {orders.filter(o => o.status !== 'done').map(order => (
              <div key={order._id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {order.sectorId?.name || '—'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {order.agent?.firstName} {order.agent?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={12} />
                    {new Date(order.dueDate).toLocaleDateString('fr-FR')}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(order.status, order.dueDate)}`}>
                    {getStatusLabel(order.status, order.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gestion Équipe ───────────────────────────────────────────────────────────
function TeamTab({ token }) {
  const [view, setView] = useState('validate');
  const [agents, setAgents] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creationData, setCreationData] = useState({ name: '', firstName: '', email: '', password: '', role: 'expert' });
  const [creationStatus, setCreationStatus] = useState({ type: '', message: '' });

  const fetchPendingAgents = useCallback(async () => {
    setLoading(true);
    try { const res = await getPendingAgents(token); setAgents(res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  const fetchSectors = useCallback(async () => {
    try { 
      const res = await fetch('http://localhost:5000/api/sectors', { headers: { 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      setSectors(data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { 
    if (view === 'validate') {
      fetchPendingAgents();
      fetchSectors();
    }
  }, [view, fetchPendingAgents, fetchSectors]);

  const handleApprove = async (id) => {
    try {
      // Approuver l'agent — le backend assigne automatiquement la ville via son propre secteur
      await approveAgent(id, null, token);
      setAgents(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter cette candidature ? Le compte sera définitivement supprimé.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reject-agent/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.message || 'Erreur serveur');
      }
      setAgents(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationStatus({ type: 'loading', message: 'Création en cours...' });
    try {
      await registerByAdmin(creationData, token);
      setCreationStatus({ type: 'success', message: `Compte ${creationData.role} créé avec succès !` });
      setCreationData({ name: '', firstName: '', email: '', password: '', role: 'expert' });
    } catch (err) {
      setCreationStatus({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la création.' });
    }
  };

  const filtered = agents.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Gestion de l'Équipe</h1>
        <p className="text-slate-400 text-sm mt-1">Valider les agents en attente et créer les comptes experts.</p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'validate', label: `Valider les Agents${agents.length > 0 ? ` (${agents.length})` : ''}` },
          { id: 'create', label: 'Créer un Compte' }
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all
              ${view === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Validation */}
      {view === 'validate' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-700 text-sm">Demandes d'activation</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..."
                className="pl-8 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="text-left px-6 py-3">Agent</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">ville</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12">
                    <RefreshCw size={24} className="animate-spin text-slate-300 mx-auto" />
                  </td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map(agent => <AgentRow key={agent._id} agent={agent} onApprove={handleApprove} onReject={handleReject} sectors={sectors} />)
                ) : (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 text-sm font-semibold">
                    Aucun agent en attente.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Création */}
      {view === 'create' && (
        <div className="max-w-lg bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <UserPlus size={18} className="text-white" />
            </div>
            <h3 className="font-black text-slate-800">Créer un nouveau membre</h3>
          </div>

          {creationStatus.message && (
            <div className={`mb-5 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2
              ${creationStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : creationStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-slate-50 text-slate-600'}`}>
              {creationStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {creationStatus.message}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'firstName', label: 'Prénom', placeholder: 'Prénom' },
                { key: 'name', label: 'Nom', placeholder: 'Nom' }
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                    value={creationData[f.key]} onChange={e => setCreationData({ ...creationData, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" placeholder="expert@portail.fr" required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl pl-9 pr-4 py-3 text-sm font-medium outline-none transition-all"
                  value={creationData.email} onChange={e => setCreationData({ ...creationData, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="Min. 6 caractères" required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl pl-9 pr-4 py-3 text-sm font-medium outline-none transition-all"
                  value={creationData.password} onChange={e => setCreationData({ ...creationData, password: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rôle</label>
              <select
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                value={creationData.role} onChange={e => setCreationData({ ...creationData, role: e.target.value })}>
                <option value="expert">Expert Technique</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <button type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95">
              Créer le compte
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Main AdminDashboard ──────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('map');

  const token = localStorage.getItem('token');
  let userName = 'Administrateur';
  try { userName = JSON.parse(localStorage.getItem('user'))?.firstName || 'Administrateur'; } catch {}

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={userName} />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        {activeTab === 'map'  && <MapTab token={token} />}
        {activeTab === 'team' && <TeamTab token={token} />}
      </main>
    </div>
  );
}

export default AdminDashboard;