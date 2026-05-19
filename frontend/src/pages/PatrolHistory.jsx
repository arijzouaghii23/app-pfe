import React, { useState, useEffect, useCallback } from 'react';
import {
  History, Calendar, Map as MapIcon, ClipboardList,
  Eye, Search, AlertCircle, X, FileText, CheckCircle2,
  MapPinOff, Loader2, Image as ImageIcon
} from 'lucide-react';
import { PatrolCard } from '../componets/PatrolCard';

const API = 'http://localhost:5000';
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

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Modale Rapport ─────────────────────────────────────────────────────────────
function ReportModal({ order, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/reports?sectorId=${order.sectorId?._id}&source=agent`);
        if (res.ok) {
          const data = await res.json();
          const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
          const filtered = data.filter(r =>
            r.sectorId === order.sectorId?._id ||
            (typeof r.sectorId === 'object' && r.sectorId?._id === order.sectorId?._id)
          );
          setReports(filtered.length > 0 ? filtered : data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [order]);

  const statusLabel = {
    PENDING_EXPERT: { label: 'En attente expert', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    VALIDATED:      { label: 'Validé',            cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    IN_PROGRESS:    { label: 'En cours',           cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    COMPLETED:      { label: 'Traité',             cls: 'bg-slate-50 text-slate-500 border-slate-100' },
    REJECTED:       { label: 'Rejeté (IA)',        cls: 'bg-red-50 text-red-500 border-red-100' },
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <FileText size={16} className="text-violet-500" />
              Rapport de patrouille
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {order.sectorId?.name || 'Secteur inconnu'} · {formatDate(order.updatedAt)}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={28} className="animate-spin text-violet-400" />
              <p className="text-slate-400 text-xs font-semibold">Chargement des anomalies...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <MapPinOff size={32} className="text-slate-300" />
              <p className="text-slate-500 font-bold text-sm">Aucune anomalie signalée</p>
            </div>
          ) : (
            <>
              <div className="bg-violet-50 rounded-2xl p-4 flex items-center gap-3 border border-violet-100">
                <CheckCircle2 size={20} className="text-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-violet-700">{reports.length} anomalie{reports.length > 1 ? 's' : ''} détectée{reports.length > 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-violet-400 font-semibold">Signalements soumis lors de cette patrouille</p>
                </div>
              </div>

              {reports.map((report, idx) => {
                const st = statusLabel[report.status] || { label: report.status, cls: 'bg-slate-50 text-slate-500 border-slate-100' };
                return (
                  <div key={report._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {report.images?.length > 0 && (
                      <div className="flex gap-1 p-2 bg-slate-50">
                        {report.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img.startsWith('http') ? img : `${API}${img}`} alt={`Anomalie ${idx + 1}`} className="w-20 h-16 object-cover rounded-xl border border-slate-100" onError={e => { e.target.style.display = 'none'; }} />
                        ))}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-black text-slate-600">Anomalie #{idx + 1}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${st.cls}`}>{st.label}</span>
                      </div>
                      {report.address && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2">
                          <MapIcon size={11} className="text-slate-300 flex-shrink-0" />
                          {report.address}
                        </div>
                      )}
                      {report.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">{report.description}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-semibold mt-2">Soumis le {formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PatrolHistory ──────────────────────────────────────────────────────────────
export default function PatrolHistory() {
  const [historyFiles, setHistoryFiles] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('patrols');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [resOrders, resMissions] = await Promise.all([
        authFetch('/api/inspection-orders/mine'),
        authFetch('/api/missions')
      ]);

      if (resOrders.ok) {
        const fullData = await resOrders.json();
        setHistoryFiles(fullData.filter(o => o.status === 'done'));
      }
      if (resMissions.ok) {
        const fullMissions = await resMissions.json();
        setCompletedMissions(fullMissions.filter(m => m.status === 'COMPLETED'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filteredHistory = historyFiles.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.sectorId?.name || '').toLowerCase().includes(term)
      || (item.sectorId?.city || '').toLowerCase().includes(term);
  });

  const filteredMissions = completedMissions.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.sectorId?.name || '').toLowerCase().includes(term)
      || (item.city || '').toLowerCase().includes(term);
  });

  const handleDownloadPDF = async (reportId) => {
    try {
        const res = await fetch(`${API}/api/reports/${reportId}/pdf`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) throw new Error("Erreur lors du téléchargement");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_mission_${reportId}.pdf`;
        a.click();
    } catch (err) {
        console.error(err);
        alert("Impossible de télécharger le rapport PDF.");
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-bold text-violet-600 tracking-wider uppercase mb-1">ARCHIVES</p>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              Historique des Opérations
            </h1>
            <p className="text-slate-500 mt-2">Vos patrouilles et réparations achevées</p>
          </div>
        </div>

        {/* Toggle Onglets */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 max-w-sm">
            <button
                onClick={() => setActiveTab('patrols')}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'patrols' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Patrouilles
            </button>
            <button
                onClick={() => setActiveTab('repairs')}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'repairs' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Réparations
            </button>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par zone, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : activeTab === 'patrols' ? (
          filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm max-w-xl mx-auto">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Aucun historique trouvé</h3>
              <p className="text-slate-500 text-sm">Vous n'avez pas encore achevé de patrouille.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map(item => (
              <PatrolCard 
                key={item._id}
                location={item.sectorId?.name || 'Zone non spécifiée'}
                city={item.sectorId?.city || 'Ville non spécifiée'}
                dateLimite={formatDate(item.updatedAt)} // completed date
                dateRecu={formatDate(item.createdAt)}
                status="completee"
                onAction={() => setSelectedOrder(item)}
              />
            ))}
          </div>
          )
        ) : (
          filteredMissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm max-w-xl mx-auto">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Aucune réparation trouvée</h3>
              <p className="text-slate-500 text-sm">Vous n'avez pas encore achevé de mission de réparation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMissions.map(item => (
                <PatrolCard 
                  key={item._id}
                  location={item.sectorId?.name || 'Zone non spécifiée'}
                  city={item.city || 'Ville non spécifiée'}
                  dateLimite={formatDate(item.updatedAt)} // completed date
                  dateRecu={formatDate(item.createdAt)}
                  status="completee"
                  onAction={() => handleDownloadPDF(item._id)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {selectedOrder && (
        <ReportModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
