import React, { useState, useEffect, useCallback } from 'react';
import {
  History, Calendar, Map as MapIcon, ClipboardList,
  Eye, Search, AlertCircle, X, FileText, CheckCircle2,
  MapPinOff, Loader2, Image as ImageIcon
} from 'lucide-react';

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
        // On récupère les rapports liés à cet ordre via le sectorId et source agent
        const res = await authFetch(`/api/reports?sectorId=${order.sectorId?._id}&source=agent`);
        if (res.ok) {
          const data = await res.json();
          // On filtre les rapports créés pendant cette patrouille (même jour que la clôture)
          // ou plus simplement : tous les rapports de l'agent pour ce secteur
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header modale */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              Rapport de patrouille
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {order.sectorId?.name || 'Secteur inconnu'} · {formatDate(order.updatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <p className="text-slate-400 text-xs font-semibold">Chargement des anomalies...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <MapPinOff size={32} className="text-slate-300" />
              <p className="text-slate-500 font-bold text-sm">Aucune anomalie signalée</p>
              <p className="text-slate-400 text-xs">Aucun signalement n'a été soumis lors de cette patrouille.</p>
            </div>
          ) : (
            <>
              {/* Résumé */}
              <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3 border border-indigo-100">
                <CheckCircle2 size={20} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-indigo-700">{reports.length} anomalie{reports.length > 1 ? 's' : ''} détectée{reports.length > 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-indigo-400 font-semibold">Signalements soumis lors de cette patrouille</p>
                </div>
              </div>

              {/* Liste des rapports */}
              {reports.map((report, idx) => {
                const st = statusLabel[report.status] || { label: report.status, cls: 'bg-slate-50 text-slate-500 border-slate-100' };
                return (
                  <div key={report._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Images */}
                    {report.images?.length > 0 && (
                      <div className="flex gap-1 p-2 bg-slate-50">
                        {report.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img.startsWith('http') ? img : `${API}${img}`}
                            alt={`Anomalie ${idx + 1}`}
                            className="w-20 h-16 object-cover rounded-xl border border-slate-100"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ))}
                        {report.images.length > 3 && (
                          <div className="w-20 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-slate-400">
                            +{report.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-black text-slate-600">Anomalie #{idx + 1}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      {report.address && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2">
                          <MapIcon size={11} className="text-slate-300 flex-shrink-0" />
                          {report.address}
                        </div>
                      )}

                      {report.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {report.description}
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400 font-semibold mt-2">
                        Soumis le {formatDate(report.createdAt)}
                      </p>
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // Modal state

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/inspection-orders/mine');
      if (res.ok) {
        const fullData = await res.json();
        setHistoryFiles(fullData.filter(o => o.status === 'done'));
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

  return (
    <>
      <div className="max-w-lg mx-auto px-4 py-6 mb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <History size={20} className="text-indigo-500" />
              Historique
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Vos patrouilles achevées</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par zone, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">Aucun historique trouvé</p>
            <p className="text-slate-400 text-xs mt-1">Vous n'avez pas encore achevé de patrouille.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(item => (
              <div key={item._id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-slate-800 flex items-center gap-1.5 text-sm">
                      <MapIcon size={14} className="text-indigo-400" />
                      {item.sectorId?.name || 'Secteur inconnu'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold ml-5">{item.sectorId?.city || 'Ville non spécifiée'}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                    Terminé
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4 mt-4 bg-slate-50 rounded-2xl p-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date de réalisation</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(item.updatedAt)}
                    </p>
                  </div>
                </div>

                {item.instructions && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <ClipboardList size={12} /> Instructions d'origine
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {item.instructions}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedOrder(item)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Eye size={14} />
                  Voir le rapport associé
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale */}
      {selectedOrder && (
        <ReportModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
