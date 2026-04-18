import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, CheckCircle, XCircle, Map as MapIcon, Send, Rocket, AlertTriangle, ClipboardList, Camera, RefreshCw, X } from 'lucide-react';

const API = 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

const authFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${getToken()}`, ...(opts.headers || {}) }
  });

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

// ── Carte Leaflet pour la patrouille ─────────────────────────────────────────
function PatrolMap({ onLocationClick }) {
  useMapEvents({
    click(e) { onLocationClick(e.latlng); }
  });
  return null;
}

// ── Modale Upload de Signalement ─────────────────────────────────────────────
function ReportUploadModal({ latlng, sectorId, onClose, onSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('images', image);
      form.append('longitude', latlng.lng);
      form.append('latitude', latlng.lat);
      form.append('description', description);
      if (sectorId) form.append('sectorId', sectorId);

      const res = await authFetch('/api/reports', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');
      onSuccess('Signalement envoyé avec succès !');
    } catch (err) {
      onSuccess(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
          <div>
            <p className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <MapPin size={16} className="text-indigo-500" /> Anomalie détectée
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Zone upload photo */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-400 transition-all"
            style={{ height: '160px' }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="text-slate-400 mb-2"><Camera size={36} /></div>
                <p className="text-sm font-bold text-slate-400">Toucher pour photographier</p>
                <p className="text-xs text-slate-300">JPG, PNG — max 5 Mo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="sr-only" />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Décrivez l'anomalie (nid-de-poule, fissure, affaissement...)"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm">
              Annuler
            </button>
            <button type="submit" disabled={!image || loading}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send size={16} /> Signaler
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vue Patrouille (carte plein écran) ───────────────────────────────────────
function PatrolView({ order, onComplete, onBack }) {
  const [clickedPos, setClickedPos] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportCount, setReportCount] = useState(0);

  const handleLocationClick = useCallback((latlng) => {
    setClickedPos(latlng);
  }, []);

  const handleReportSuccess = (message, type = 'success') => {
    setClickedPos(null);
    if (type === 'success') setReportCount(c => c + 1);
    setToast({ message, type });
  };

  const handleComplete = async () => {
    if (!window.confirm('Terminer la patrouille ? Le secteur sera marqué comme inspecté.')) return;
    setCompleting(true);
    try {
      const res = await authFetch(`/api/inspection-orders/${order._id}/complete`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onComplete(data.message);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setCompleting(false);
    }
  };

  const sectorName = order.sectorId?.name || 'Secteur en cours';

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-900">
      {/* Header mobile de la patrouille */}
      <div className="flex-shrink-0 bg-slate-900 px-4 py-3 flex items-center justify-between safe-area-top">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-all text-lg">
          ←
        </button>
        <div className="text-center">
          <p className="text-white font-black text-sm truncate max-w-[180px] flex items-center justify-center gap-1.5">
            <MapIcon size={16} /> {sectorName}
          </p>
          <p className="text-slate-400 text-[10px] font-semibold">
            {reportCount > 0 ? `${reportCount} signalement${reportCount > 1 ? 's' : ''} envoyé${reportCount > 1 ? 's' : ''}` : 'Appuyez sur la carte pour signaler'}
          </p>
        </div>
        {/* Bouton Terminer */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/50"
        >
          {completing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <div className="flex items-center gap-1.5"><CheckCircle size={14} /> Terminer</div>}
        </button>
      </div>

      {/* Carte Leaflet plein écran */}
      <div className="flex-1 relative">
        <MapContainer
          center={[45.75, 4.85]} // Centre sur Lyon par défaut
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM &copy; CARTO'
          />
          <PatrolMap onLocationClick={handleLocationClick} />
        </MapContainer>

        {/* Indicateur de tap flottant */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[800] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
            <MapPin size={14} /> Appuyez sur la carte pour signaler
          </div>
        </div>
      </div>

      {/* Modale signalement */}
      {clickedPos && (
        <ReportUploadModal
          latlng={clickedPos}
          sectorId={order.sectorId?._id || order.sectorId}
          onClose={() => setClickedPos(null)}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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

// ── AgentDashboard — Composant Principal ─────────────────────────────────────
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

  // ── Vue Liste (accueil agent) ──
  const userName = (() => {
    try { const u = JSON.parse(localStorage.getItem('user')); return u?.firstName || u?.name || 'Agent'; } catch { return 'Agent'; }
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header mobile */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SIG Routier</p>
              <h1 className="text-xl font-black text-slate-800">Bonjour, {userName}</h1>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-black text-base">{userName[0].toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Sous-titre section */}
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

        {/* Contenu principal */}
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
              <OrderCard key={order._id} order={order} onStart={handleStart} />
            ))}
          </div>
        )}
      </div>

      {/* Toast global */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
