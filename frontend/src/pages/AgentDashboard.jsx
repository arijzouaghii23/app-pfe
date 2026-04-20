import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Map as MapIcon, Rocket, AlertTriangle, ClipboardList, RefreshCw, Home, History, User } from 'lucide-react';
import PatrolView from './PatrolView';
import PatrolHistory from './PatrolHistory';
import Profile from './Profile';

const API = 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

const authFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${getToken()}`, ...(opts.headers || {}) }
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return res;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const isLate = (d) => d && new Date(d) < new Date();

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <span className="flex items-center justify-center">{type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}</span>
      <span>{message}</span>
    </div>
  );
}

// ── Carte d'ordre (vue liste) ─────────────────────────────────────────────────
function OrderCard({ order, onStart }) {
  const late = isLate(order.dueDate);
  const sectorName = order.sectorId?.name || 'Secteur inconnu';
  const city = order.sectorId?.city || '';

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all active:scale-[0.98]
      ${late ? 'border-red-200 shadow-red-50' : 'border-slate-100'}`}>

      {/* Barre de statut colorée */}
      <div className={`h-1.5 w-full ${late ? 'bg-red-500' : 'bg-indigo-500'}`} />

      <div className="p-5">
        {/* Header carte */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapIcon size={20} className="text-slate-400 shrink-0" />
              <h3 className="font-black text-slate-800 text-base truncate">{sectorName}</h3>
            </div>
            {city && <p className="text-xs font-semibold text-slate-400 ml-7">{city}</p>}
          </div>
          <span className={`flex-shrink-0 ml-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border
            ${late ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {late ? <div className="flex items-center gap-1"><AlertTriangle size={12} /> Retard</div> : 'En attente'}
          </span>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 rounded-2xl p-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date limite</p>
            <p className={`text-sm font-black ${late ? 'text-red-600' : 'text-slate-800'}`}>
              {formatDate(order.dueDate)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reçu le</p>
            <p className="text-sm font-black text-slate-800">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Instructions */}
        {order.instructions && (
          <div className="bg-indigo-50 rounded-2xl px-4 py-3 mb-4 border border-indigo-100">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ClipboardList size={12} /> Instructions</p>
            <p className="text-xs text-indigo-700 font-medium leading-relaxed">{order.instructions}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onStart(order)}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <Rocket size={18} />
          <span>Démarrer la Patrouille</span>
        </button>
      </div>
    </div>
  );
}

// ── Vue vide ──────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="flex justify-center mb-6"><CheckCircle size={64} className="text-emerald-500" /></div>
      <h3 className="text-slate-800 font-black text-lg mb-2">Aucun ordre en attente</h3>
      <p className="text-slate-400 text-sm font-medium leading-relaxed">
        Félicitations ! Vous n'avez aucune patrouille assignée pour le moment.
        Revenez plus tard ou contactez votre administrateur.
      </p>
    </div>
  );
}

// ── Vue Liste Patrouilles (Accueil Agent) ────────────────────────────────────
function HomeTab({ orders, loading, fetchOrders, onStart, userName }) {
  return (
    <>
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SIG Routier</p>
              <h1 className="text-xl font-black text-slate-800">Bonjour, {userName}</h1>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-black text-base">{userName[0]?.toUpperCase() || 'A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 mb-20">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">Mes Patrouilles</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Ordres en attente d'inspection</p>
          </div>
          <button onClick={fetchOrders}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all shadow-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-semibold text-sm">Chargement des missions...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order._id} order={order} onStart={onStart} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── AgentDashboard — Navigation Layout ───────────────────────────────────────
export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null); // L'ordre en cours de patrouille
  const [toast, setToast] = useState(null);

  // Charger les ordres en attente
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/inspection-orders/mine');
      if (!res.ok) throw new Error('Erreur chargement des ordres');
      const data = await res.json();
      // Filtrer uniquement les ordres pending (pas 'done', pas 'acknowledged')
      const pending = data.filter(o => o.status === 'pending' || o.status === 'acknowledged');
      setOrders(pending);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Démarrer une patrouille (acknowledge implicite + afficher la carte)
  const handleStart = async (order) => {
    // Accuser réception automatiquement si pas encore fait
    if (order.status === 'pending') {
      try {
        await authFetch(`/api/inspection-orders/${order._id}/acknowledge`, { method: 'PATCH' });
      } catch (_) { /* non bloquant */ }
    }
    setActiveOrder(order);
  };

  // Terminer la patrouille
  const handleComplete = (message) => {
    setActiveOrder(null);
    setToast({ message, type: 'success' });
    fetchOrders(); // Rafraîchir la liste (l'ordre terminé disparaît)
  };

  // Revenir à la liste sans terminer
  const handleBack = () => setActiveOrder(null);

  const userName = (() => {
    try { const u = JSON.parse(localStorage.getItem('user')); return u?.firstName || u?.name || 'Agent'; } catch { return 'Agent'; }
  })();

  const [activeTab, setActiveTab] = useState('home'); // home, history, profile

  // ── Vue Patrouille (overlay plein écran) ──
  if (activeOrder) {
    return (
      <PatrolView
        order={activeOrder}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }


  const renderContent = () => {
    switch(activeTab) {
      case 'history': return <PatrolHistory />;
      case 'profile': return <Profile />;
      case 'home':
      default:
        return <HomeTab orders={orders} loading={loading} fetchOrders={fetchOrders} onStart={handleStart} userName={userName} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-10">
      
      {/* Contenu dynamique principal */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-40 pb-safe">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home size={20} className={activeTab === 'home' ? 'fill-indigo-50' : ''} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>Patrouille</span>
          </button>
          
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <History size={20} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}>Histo.</span>
          </button>

          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={20} className={activeTab === 'profile' ? 'fill-indigo-50' : ''} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>Profil</span>
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
