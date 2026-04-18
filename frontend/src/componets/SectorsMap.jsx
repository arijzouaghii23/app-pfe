import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { CheckCircle, XCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Composant enfant : Zoom Automatique ───────────────────────────────────────
const FitBoundsComponent = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      try {
        const bounds = L.geoJSON(data).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (err) {
        console.error('Erreur fitBounds :', err);
      }
    }
  }, [map, data]);
  return null;
};

// ── Modale Click-to-Order ─────────────────────────────────────────────────────
const OrderModal = ({ sector, agents, onClose, onConfirm, loading }) => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgentId || !dueDate) return;
    onConfirm({ agentId: selectedAgentId, dueDate, instructions });
  };

  const availableAgents = agents.filter(a => !a.isBlocked);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Nouvel Ordre d'Inspection</p>
              <h3 className="text-white font-black text-xl leading-tight">{sector.name}</h3>
              <span className="inline-flex items-center gap-1.5 mt-2 bg-white/10 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className={`w-2 h-2 rounded-full ${sector.statusColor === 'RED' ? 'bg-red-400' : sector.statusColor === 'ORANGE' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                Statut : {sector.statusColor === 'RED' ? 'Périmé' : sector.statusColor === 'ORANGE' ? 'À surveiller' : 'Récent'}
              </span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Sélection Agent */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Agent Assigné
              {availableAgents.length === 0 && <span className="ml-2 text-red-500 normal-case font-semibold">— Aucun agent disponible</span>}
            </label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              required
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-semibold text-sm outline-none transition-all"
            >
              <option value="">— Sélectionner un agent —</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id} disabled={agent.isBlocked}>
                  {agent.firstName} {agent.name}{agent.isBlocked ? ' (Occupé)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Limite */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date Limite</label>
            <input
              type="date"
              value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-semibold text-sm outline-none transition-all"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Instructions (optionnel)</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={2}
              placeholder="Points spécifiques à inspecter..."
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-medium text-sm outline-none transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAgentId || !dueDate}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {loading ? 'Envoi...' : <><CheckCircle size={16} /> Confirmer l'Ordre</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Toast Notification ────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <span className="flex items-center justify-center">{type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><XCircle size={14} /></button>
    </div>
  );
};

// ── Légende de couleurs ───────────────────────────────────────────────────────
const MapLegend = () => (
  <div className="absolute bottom-6 left-6 z-[800] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-slate-100">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">État de Patrouille</p>
    {[
      { color: '#10b981', label: '< 3 mois', desc: 'Récent' },
      { color: '#f59e0b', label: '3–6 mois', desc: 'À surveiller' },
      { color: '#ef4444', label: '> 6 mois', desc: 'Périmé' },
    ].map(item => (
      <div key={item.color} className="flex items-center gap-2 mb-1">
        <div className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ backgroundColor: item.color }}></div>
        <span className="text-xs font-semibold text-slate-600">{item.desc} <span className="text-slate-400 font-normal">({item.label})</span></span>
      </div>
    ))}
  </div>
);

// ── Composant Principal SectorsMap ────────────────────────────────────────────
const SectorsMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [rawSectors, setRawSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalSector, setModalSector] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  // ── 1. Charger les secteurs depuis l'API ──────────────────────────────────
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sectors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRawSectors(data);

        const featureCollection = {
          type: 'FeatureCollection',
          features: data.map(s => ({
            type: 'Feature',
            properties: {
              _id: s._id,
              name: s.name,
              city: s.city,
              statusColor: s.statusColor || 'RED',
              lastInsp: s.lastInspectionDate,
            },
            geometry: s.geometry
          }))
        };
        setGeoData(featureCollection);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSectors();
  }, [token]);

  // ── 2. Charger les agents au clic sur un secteur ──────────────────────────
  const handleSectorClick = useCallback(async (feature) => {
    setModalSector(feature.properties);
    setAgents([]);
    setAgentsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/inspection-orders/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error('Erreur chargement agents :', err);
    } finally {
      setAgentsLoading(false);
    }
  }, [token]);

  // ── 3. Confirmer et créer l'ordre ────────────────────────────────────────
  const handleConfirmOrder = async ({ agentId, dueDate, priority, instructions }) => {
    if (!modalSector) return;
    setOrderLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/inspection-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId,
          sectorId: modalSector._id,
          dueDate,
          instructions
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur serveur');
      }
      setModalSector(null);
      setToast({ message: `Ordre émis pour ${modalSector.name} !`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Styling GeoJSON ───────────────────────────────────────────────────────
  const styleFeature = (feature) => {
    const c = feature.properties.statusColor;
    const fill = c === 'GREEN' ? '#10b981' : c === 'ORANGE' ? '#f59e0b' : '#ef4444';
    return {
      fillColor: fill,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '4',
      fillOpacity: 0.65
    };
  };

  // ── onEachFeature : tooltip + clic ───────────────────────────────────────
  const onEachFeature = (feature, layer) => {
    const { name, statusColor, lastInsp } = feature.properties;
    const dateStr = lastInsp
      ? new Date(lastInsp).toLocaleDateString('fr-FR')
      : 'Jamais inspecté';

    layer.bindTooltip(`
      <div style="font-family:system-ui;font-size:13px;min-width:180px">
        <strong style="font-size:14px;color:#1e293b;display:block;margin-bottom:4px">${name}</strong>
        <span style="color:#64748b">Dernière patrouille :</span> ${dateStr}<br/>
        <span style="color:#64748b">Statut :</span> <b>${statusColor === 'RED' ? '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#ef4444;margin-right:4px;"></span> Périmé' : statusColor === 'ORANGE' ? '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#f59e0b;margin-right:4px;"></span> À surveiller' : '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#10b981;margin-right:4px;"></span> Récent'}</b>
        <div style="margin-top:6px;font-size:11px;color:#94a3b8;font-style:italic">Cliquer pour créer un ordre</div>
      </div>
    `, { sticky: true });

    // ── L'événement clic principal ──
    layer.on({
      click: () => handleSectorClick(feature),
      mouseover: (e) => { e.target.setStyle({ weight: 3, fillOpacity: 0.85, color: '#4f46e5' }); },
      mouseout: (e) => { e.target.setStyle(styleFeature(feature)); }
    });
  };

  // ── Renders ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-3xl gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-semibold text-sm">Chargement du SIG...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full bg-red-50 rounded-3xl">
      <p className="text-red-500 font-bold">Erreur : {error}</p>
    </div>
  );

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      {/* La carte */}
      <MapContainer scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {geoData && geoData.features.length > 0 && (
          <>
            <FitBoundsComponent data={geoData} />
            <GeoJSON key="sectors-layer" data={geoData} style={styleFeature} onEachFeature={onEachFeature} />
          </>
        )}
      </MapContainer>

      {/* Légende superposée */}
      <MapLegend />

      {/* Modale Click-to-Order */}
      {modalSector && (
        <OrderModal
          sector={modalSector}
          agents={agentsLoading ? [] : agents}
          loading={orderLoading || agentsLoading}
          onClose={() => setModalSector(null)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SectorsMap;
