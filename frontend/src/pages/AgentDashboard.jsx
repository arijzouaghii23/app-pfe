import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, FileText, CheckCircle2, Printer, X } from 'lucide-react';
import PatrolView from './PatrolView';
import PatrolHistory from './PatrolHistory';
import Profile from './Profile';
import MissionView from './MissionView';
import { useLocation, useNavigate } from 'react-router-dom';

import { PatrolCard } from '../componets/PatrolCard';
import { PatrolChart } from '../componets/PatrolChart';
import { MissionChart } from '../componets/MissionChart';
import { StatsCards } from '../componets/StatsCards';

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

// ── Vue Patrouille (Accueil Agent) ────────────────────────────────────────────
function HomeTab({ orders, loading, fetchOrders, onStart, userName }) {
  const activeOrders = orders.filter(o => o.status !== 'done');
  const total = orders.length;
  const completed = orders.filter(o => o.status === 'done').length;
  const pending = activeOrders.filter(o => o.status === 'pending').length;
  const inProgress = activeOrders.filter(o => o.status === 'acknowledged').length;
  const late = activeOrders.filter(o => isLate(o.dueDate)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold text-violet-600 tracking-wider uppercase mb-1">RouteSignal</p>
          <h1 className="text-3xl font-black text-slate-900">Bonjour, {userName} </h1>
          <p className="text-slate-500 mt-2">Voici un aperçu de vos patrouilles aujourd'hui</p>
        </div>
        <button onClick={fetchOrders} className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm active:scale-95">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm font-semibold">Actualiser</span>
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsCards total={total} completed={completed} pending={pending} inProgress={inProgress} late={late} type={typeof activeOrders !== "undefined" ? "patrol" : "mission"} />
      </div>

      {/* Chart */}
      <div className="mb-10">
        <PatrolChart orders={orders} />
      </div>

      {/* Active Patrols */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Mes Patrouilles Actives</h2>
          <p className="text-sm text-slate-500">Ordres en attente d'inspection ou en cours</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tout est à jour !</h3>
            <p className="text-slate-500 text-sm">Vous n'avez aucune patrouille en attente pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...activeOrders].map(order => {
              let status = 'en_attente';
              if (order.status === 'acknowledged') status = 'en_cours';
              if (isLate(order.dueDate) && order.status !== 'done') status = 'en_retard';
              return { ...order, derivedStatus: status };
            }).sort((a, b) => {
              const priority = { 'en_retard': 1, 'en_cours': 2, 'en_attente': 3 };
              if (priority[a.derivedStatus] !== priority[b.derivedStatus]) {
                return priority[a.derivedStatus] - priority[b.derivedStatus];
              }
              const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
              const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
              return dateA - dateB;
            }).map(order => (
                <PatrolCard 
                  key={order._id}
                  location={order.sectorId?.name || 'Secteur inconnu'}
                  city={order.sectorId?.city || ''}
                  dateLimite={formatDate(order.dueDate)}
                  dateRecu={formatDate(order.createdAt)}
                  status={order.derivedStatus}
                  progress={order.derivedStatus === 'en_cours' ? 45 : 0}
                  onAction={() => onStart(order)}
                />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vue Missions de Réparation ─────────────────────────────────────────────────
function MissionsTab({ userName, onStartMission }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/missions');
      if (!res.ok) throw new Error('Erreur chargement des missions');
      const data = await res.json();
      setMissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const activeMissions = missions.filter(m => m.status === 'IN_PROGRESS');
  const total = missions.length;
  const completed = missions.filter(m => m.status === 'COMPLETED').length;
  const pending = missions.filter(m => m.status === 'PENDING' || m.status === 'PENDING_EXPERT').length;
  const inProgress = activeMissions.length;
  const late = activeMissions.filter(m => m.mission?.estimatedEndDate && isLate(m.mission.estimatedEndDate)).length;

  const [reportModal, setReportModal] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (reportModal) {
      setPdfLoading(true);
      authFetch(`/api/reports/${reportModal._id}/pdf`)
        .then(res => {
          if (!res.ok) throw new Error("Erreur de récupération du PDF");
          return res.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        })
        .catch(err => {
          console.error("Erreur PDF:", err);
          // Gérer l'erreur si besoin
        })
        .finally(() => setPdfLoading(false));
    } else {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [reportModal]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold text-violet-600 tracking-wider uppercase mb-1">INTERVENTIONS</p>
          <h1 className="text-3xl font-black text-slate-900">Missions de Réparation </h1>
          <p className="text-slate-500 mt-2">Suivi de vos affectations d'expertise</p>
        </div>
        <button onClick={fetchMissions} className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm active:scale-95">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm font-semibold">Actualiser</span>
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsCards total={total} completed={completed} pending={pending} inProgress={inProgress} late={late} type="mission" />
      </div>

      {/* Chart */}
      <div className="mb-10">
        <MissionChart missions={missions} />
      </div>

      {/* Active Missions */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Missions Actives</h2>
          <p className="text-sm text-slate-500">Seules les réparations en cours (IN_PROGRESS) sont affichées ici.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : missions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Aucune mission en cours</h3>
            <p className="text-slate-500 text-sm">Vous n'avez aucune réparation affectée pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...activeMissions].sort((a, b) => {
              const dateA = a.mission?.startDate ? new Date(a.mission.startDate).getTime() : Infinity;
              const dateB = b.mission?.startDate ? new Date(b.mission.startDate).getTime() : Infinity;
              return dateA - dateB;
            }).map(mission => {
                const historyCount = mission.mission?.history?.length || 0;
                let btnLabel = historyCount === 0 ? "Démarrer la Réparation" : "Continuer la Réparation";

                return (
                <PatrolCard 
                  key={mission._id}
                  theme="mission"
                  location={mission.sectorId?.name || mission.city || 'Zone inconnue'}
                  city="Intervention Terrain"
                  labelDate1="Début Estimé"
                  labelDate2="Fin Estimée"
                  dateLimite={mission.mission?.startDate ? formatDate(mission.mission.startDate) : 'Non définie'}
                  dateRecu={mission.mission?.estimatedEndDate ? formatDate(mission.mission.estimatedEndDate) : 'Non définie'}
                  status={historyCount === 0 ? "nouvelle_mission" : "en_cours"}
                  progress={0}
                  actionLabel={btnLabel}
                  onAction={() => onStartMission(mission)}
                  onViewReport={() => setReportModal(mission)}
                />
                );
            })}
          </div>
        )}
      </div>

      {/* Modal Rapport d'Expertise (Vrai PDF Viewer - Simple) */}
      {reportModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setReportModal(null)}>
          
          <div className="relative w-full max-w-4xl h-[85vh] bg-slate-200 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Bouton de fermeture flottant */}
            <div className="absolute top-3 right-5 z-10 flex items-center gap-3">
              <button onClick={() => setReportModal(null)} className="bg-slate-800/80 hover:bg-slate-800 text-white p-2 rounded-xl shadow-lg backdrop-blur transition-all flex items-center justify-center">
                <X size={24} />
              </button>
            </div>

            {/* Document Container */}
            <div className="flex-1 w-full h-full relative">
              {pdfLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Chargement du document...</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe 
                  src={pdfBlobUrl} 
                  title="Document PDF"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white text-red-500 font-bold">
                  Impossible de charger le document PDF.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AgentDashboard — Navigation Layout ───────────────────────────────────────
export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null); 
  const [activeMission, setActiveMission] = useState(null); 
  const [toast, setToast] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.startMission) {
      setActiveMission(location.state.startMission);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Charger TOUS les ordres pour les stats
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/inspection-orders/mine');
      if (!res.ok) throw new Error('Erreur chargement des ordres');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStart = async (order) => {
    if (order.status === 'pending') {
      try {
        await authFetch(`/api/inspection-orders/${order._id}/acknowledge`, { method: 'PATCH' });
      } catch (_) { }
    }
    setActiveOrder(order);
  };

  const handleComplete = (message) => {
    setActiveOrder(null);
    setToast({ message, type: 'success' });
    fetchOrders();
  };

  const userName = (() => {
    try { const u = JSON.parse(localStorage.getItem('user')); return u?.firstName || u?.name || 'Agent'; } catch { return 'Agent'; }
  })();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'home';

  // ── Vue Patrouille (overlay plein écran) ──
  if (activeOrder) {
    return (
      <PatrolView
        order={activeOrder}
        onComplete={handleComplete}
        onBack={() => setActiveOrder(null)}
      />
    );
  }

  // ── Vue Mission (overlay plein écran) ──
  if (activeMission) {
    return (
      <MissionView
        mission={activeMission}
        onComplete={(msg) => {
            setActiveMission(null);
            setToast({ message: msg, type: 'success' });
            navigate('/agent?tab=missions');
        }}
        onBack={() => setActiveMission(null)}
      />
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'history': return <PatrolHistory />;
      case 'profile': return <Profile />;
      case 'missions': return <MissionsTab userName={userName} onStartMission={setActiveMission} />;
      case 'home':
      default:
        return <HomeTab orders={orders} loading={loading} fetchOrders={fetchOrders} onStart={handleStart} userName={userName} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 relative pb-10">
      {renderContent()}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
