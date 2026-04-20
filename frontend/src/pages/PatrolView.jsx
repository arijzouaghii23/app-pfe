import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, CheckCircle, XCircle, Map as MapIcon, Send, Camera, X } from 'lucide-react';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authFetch = (url, opts = {}) => fetch(`${API}${url}`, { ...opts, headers: { 'Authorization': `Bearer ${getToken()}`, ...(opts.headers || {}) } });

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

// ── Fit Bounds Auto-Zoom ───────────────────────────────────────────────────
const FitBoundsComponent = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      try {
        const bounds = L.geoJSON(data).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.error('Erreur fitBounds :', err);
      }
    }
  }, [map, data]);
  return null;
};

// ── Carte Leaflet Patrouille (Clicks) ────────────────────────────────────────
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
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
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
          <div onClick={() => fileRef.current?.click()} className="relative border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-400 transition-all" style={{ height: '160px' }}>
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
          <div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Décrivez l'anomalie..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none placeholder:text-slate-300" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all">Annuler</button>
            <button type="submit" disabled={!image || loading} className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all flex items-center justify-center shadow-lg shadow-indigo-100">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <div className="flex items-center gap-1.5"><Send size={16} /> Signaler</div>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vue Patrouille Principale ───────────────────────────────────────────────
export default function PatrolView({ order, onComplete, onBack }) {
  const [clickedPos, setClickedPos] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportCount, setReportCount] = useState(0);
  const [geoData, setGeoData] = useState(null);

  // Charger le GeoJSON du Secteur
  useEffect(() => {
    const fetchSectorGeometry = async () => {
      try {
        const sectorId = order.sectorId?._id || order.sectorId;
        const res = await authFetch('/api/sectors');
        if (!res.ok) throw new Error('Erreur chargement secteurs');
        const sectors = await res.json();
        
        const targetSector = sectors.find(s => s._id === sectorId);
        if (targetSector && targetSector.geometry) {
          const featureCollection = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { name: targetSector.name, city: targetSector.city },
              geometry: targetSector.geometry
            }]
          };
          setGeoData(featureCollection);
        }
      } catch (err) {
        console.error("Impossible de charger le secteur:", err);
      }
    };
    fetchSectorGeometry();
  }, [order.sectorId]);

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

  const styleFeature = () => {
    return {
      fillColor: '#4f46e5', // indigo-600
      weight: 3,
      opacity: 1,
      color: '#312e81', // indigo-900
      dashArray: '4',
      fillOpacity: 0.2
    };
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-900">
      {/* Header mobile de la patrouille */}
      <div className="flex-shrink-0 bg-slate-900 px-4 py-3 flex items-center justify-between safe-area-top shadow-xl z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-all text-lg">←</button>
        <div className="text-center flex-1 mx-2 overflow-hidden">
          <p className="text-white font-black text-sm truncate flex items-center justify-center gap-1.5">
            <MapIcon size={16} className="text-indigo-400 shrink-0" /> <span className="truncate">{sectorName}</span>
          </p>
          <p className="text-indigo-300 text-[10px] font-bold">
            {reportCount > 0 ? `${reportCount} anomalie${reportCount > 1 ? 's' : ''} signalée${reportCount > 1 ? 's' : ''}` : 'Mode multi-clics actif'}
          </p>
        </div>
        <button onClick={handleComplete} disabled={completing} className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/50 flex-shrink-0">
          {completing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <div className="flex items-center gap-1.5"><CheckCircle size={14} /> Terminer</div>}
        </button>
      </div>

      {/* Carte Leaflet plein écran */}
      <div className="flex-1 relative">
        <MapContainer center={[34.0, 9.0]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <PatrolMap onLocationClick={handleLocationClick} />
          {geoData && (
            <>
              <FitBoundsComponent data={geoData} />
              <GeoJSON data={geoData} style={styleFeature} />
            </>
          )}
        </MapContainer>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[800] pointer-events-none w-full px-4">
          <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-2xl border border-slate-700/50 mx-auto max-w-[320px]">
             <MapPin size={16} className="text-indigo-400" /> <span className="text-center">Tapotez le polygone pour signaler</span>
          </div>
        </div>
      </div>

      {clickedPos && (
        <ReportUploadModal
          latlng={clickedPos}
          sectorId={order.sectorId?._id || order.sectorId}
          onClose={() => setClickedPos(null)}
          onSuccess={handleReportSuccess}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
