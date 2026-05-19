import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { MapPin, Camera, Zap, CheckCircle, XCircle, Bot, Lock, Rocket, X, Check, Activity, AlertTriangle, CheckCircle2, Sparkles, ArrowRight, Shield, MousePointer2 } from 'lucide-react';
import './LandingPage.css';

// Fix icône Leaflet (problème Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API = 'http://localhost:5000';

// ── Marqueur sur clic carte ───────────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// ── Barre de recherche avec Auto-Zoom ─────────────────────────────────────────
function SearchField() {
  const map = useMap();
  React.useEffect(() => {
    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'fr,tn', // Restreindre les résultats à la France et la Tunisie
        'accept-language': 'fr' // Prioriser les noms en français
      }
    });
    
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Rechercher une ville (ex: Lyon)...',
      zoomLevel: 14 // Niveau de zoom approprié (vue de quartier/rue)
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);
  return null;
}

// ── Toast moderne ─────────────────────────────────────────────────────────────
function Toast({ type, title, message, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[99999] max-w-sm w-full flex items-start gap-3 p-4 rounded-2xl shadow-2xl
      ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white
      animate-in slide-in-from-bottom-4 duration-300`}
    >
      <div className="text-xl flex-shrink-0 flex items-center justify-center">
        {type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm">{title}</p>
        <p className="text-xs opacity-80 mt-0.5 font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"><X size={16} /></button>
    </div>
  );
}

// ── Modale de signalement ─────────────────────────────────────────────────────
function ReportModal({ latlng, onClose, onSuccess }) {
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

      const res = await fetch(`${API}/api/reports`, { method: 'POST', body: form });
      const data = await res.json();

      if (res.status === 400 && data.message?.includes('Zone non couverte')) {
        onSuccess('zone_error', data.message);
      } else if (!res.ok) {
        throw new Error(data.message || 'Erreur serveur');
      } else {
        onSuccess(data.report?.status === 'REJECTED' ? 'refused' : 'success', data.message);
      }
    } catch (err) {
      onSuccess('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-800 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <MapPin size={12} /> Nouveau Signalement
              </p>
              <h3 className="text-white font-black text-lg">Décrivez l'anomalie</h3>
              <p className="text-blue-300/70 text-xs mt-1 font-medium">
                {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
              </p>
            </div>
            <button onClick={onClose}
              className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Zone photo */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all group"
            style={{ height: '180px' }}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-xl">Changer la photo</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 group-hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 transition-colors">
                  <Camera size={28} />
                </div>
                <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Ajouter une photo</p>
                <p className="text-xs text-slate-400">JPG, PNG — Max 5 Mo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Nid-de-poule, fissure, affaissement de chaussée..."
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-400 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all">
              Annuler
            </button>
            <button type="submit" disabled={!image || loading}
              className="flex-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all shadow-lg shadow-blue-100 active:scale-95">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyse IA en cours...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Rocket size={18} /> Envoyer le signalement
                </div>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Lock size={12} /> Signalement anonyme — Aucun compte requis
          </p>
        </form>
      </div>
    </div>
  );
}

// ── HeroMockup ───────────────────────────────────────────────
const HeroMockup = () => {
  return (
    <div className="hero-mockup-wrap">
      {/* Decorative glow rings */}
      <div className="glow-ring glow-ring-1" />
      <div className="glow-ring glow-ring-2" />

      {/* Floating badges */}
      <div className="floating-badge badge-top">
        <div className="badge-dot pulse-dot" />
        <div>
          <div className="badge-title">Vérification IA</div>
          <div className="badge-sub">Vérifié • 70%</div>
        </div>
      </div>

      <div className="floating-badge badge-bottom">
        <CheckCircle2 size={18} color="#22c55e" />
        <div>
          <div className="badge-title">Signalement envoyé</div>
          <div className="badge-sub">Il y a 2 sec.</div>
        </div>
      </div>

      <div className="floating-badge badge-side">
        <Zap size={16} color="#fbbf24" />
        <span style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 600 }}>
          Temps réel
        </span>
      </div>

      {/* Screen frame — landscape tablet/PC */}
      <div className="screen-frame">
        <div className="screen-bezel">
          {/* Webcam dot */}
          <div className="screen-cam" />
        </div>
        <div className="screen-display">
          {/* App header */}
          <div className="phone-header">
            <img src="/logoSIG.png" alt="RouteSignal Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>
                RouteSignal
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                Casablanca, Maroc
              </div>
            </div>
            <Activity size={16} color="#60a5fa" />
          </div>

          {/* Map area */}
          <div className="phone-map">
            {/* Grid lines */}
            <div className="map-grid" />

            {/* Roads */}
            <svg
              viewBox="0 0 500 250"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <path
                d="M 0 125 Q 120 100 250 130 T 500 120"
                stroke="rgba(96,165,250,0.4)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M 250 0 Q 260 60 250 125 T 240 250"
                stroke="rgba(96,165,250,0.3)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M 50 40 Q 180 80 320 60 T 480 50"
                stroke="rgba(96,165,250,0.2)"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            {/* Heatmap blobs */}
            <div className="heatmap heatmap-1" />
            <div className="heatmap heatmap-2" />

            {/* Scan pulse */}
            <div className="scan-pulse" />
            <div className="scan-pulse scan-pulse-delay" />

            {/* Map markers */}
            <div className="map-marker marker-1">
              <MapPin size={14} fill="#ef4444" color="#fff" strokeWidth={2} />
            </div>
            <div className="map-marker marker-2">
              <MapPin size={14} fill="#f59e0b" color="#fff" strokeWidth={2} />
            </div>
            <div className="map-marker marker-3 marker-active">
              <MapPin size={16} fill="#3b82f6" color="#fff" strokeWidth={2} />
            </div>
          </div>

          {/* Bottom bar with notification + stats */}
          <div className="screen-bottom-bar">
            {/* Notification card */}
            <div className="phone-notif">
              <div className="phone-notif-icon">
                <AlertTriangle size={14} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '2px',
                  }}
                >
                  Dégradation détectée
                </div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                  Bd Zerktouni • Priorité haute
                </div>
                {/* Confidence bar */}
                <div className="conf-bar">
                  <div className="conf-fill" />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="phone-stats">
              <div className="phone-stat">
                <div className="phone-stat-num">247</div>
                <div className="phone-stat-lbl">Signalés</div>
              </div>
              <div className="phone-stat">
                <div className="phone-stat-num" style={{ color: '#22c55e' }}>
                  198
                </div>
                <div className="phone-stat-lbl">Résolus</div>
              </div>
              <div className="phone-stat">
                <div className="phone-stat-num" style={{ color: '#fbbf24' }}>
                  49
                </div>
                <div className="phone-stat-lbl">En cours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── HowItWorks ───────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: 'Localisez',
    desc: "Cliquez directement sur la carte interactive à l'endroit exact de l'anomalie. Aucune adresse à taper, c'est intuitif et rapide.",
    icon: <MapPin size={22} />,
    accent: '#3b82f6',
    preview: (
      <div className="step-preview step-preview-map">
        <div className="step-map-grid" />
        <svg
          viewBox="0 0 200 120"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <path
            d="M 0 60 Q 50 40 100 60 T 200 50"
            stroke="rgba(59,130,246,0.5)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 100 0 L 95 120"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <div className="step-pin">
          <MapPin size={18} fill="#ef4444" color="#fff" strokeWidth={2} />
        </div>
        <div className="step-pulse" />
        <div className="step-cursor"><MousePointer2 size={24} className="text-slate-400" /></div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'Photographiez',
    desc: "Prenez une photo de la dégradation. Notre système vérifie automatiquement votre photo pour confirmer la présence du dommage avant de l'envoyer.",
    icon: <Camera size={22} />,
    accent: '#8b5cf6',
    preview: (
      <div className="step-preview step-preview-camera">
        <div className="step-camera-frame">
          <div className="step-camera-corner tl" />
          <div className="step-camera-corner tr" />
          <div className="step-camera-corner bl" />
          <div className="step-camera-corner br" />
          <div className="step-road-bg" />
          <div className="step-pothole" />
          <div className="step-detect-box">
            <span className="step-detect-label">Vérifié : 70%</span>
          </div>
        </div>
        <div className="step-camera-btn">
          <div className="step-camera-btn-inner" />
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: "On s'en charge",
    desc: 'Votre signalement est transmis instantanément aux experts et agents de terrain.',
    icon: <Activity size={22} />,
    accent: '#10b981',
    preview: (
      <div className="step-preview step-preview-status">
        <div className="status-row status-row-done">
          <div className="status-check">✓</div>
          <div>
            <div className="status-title">Signalement reçu</div>
            <div className="status-time">Il y a 2 sec.</div>
          </div>
        </div>
        <div className="status-connector" />
        <div className="status-row status-row-done">
          <div className="status-check">✓</div>
          <div>
            <div className="status-title">Analyse IA validée</div>
            <div className="status-time">Il y a 1 sec.</div>
          </div>
        </div>
        <div className="status-connector" />
        <div className="status-row status-row-active">
          <div className="status-check status-check-active">
            <span className="status-spinner" />
          </div>
          <div>
            <div className="status-title">Agent en route</div>
            <div className="status-time">
              <Sparkles size={10} style={{ display: 'inline' }} /> En cours
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const HowItWorks = () => {
  return (
    <div className="how-it-works">
      {/* Timeline connector line */}
      <div className="timeline-line" />

      {steps.map((step, idx) => (
        <div
          key={step.num}
          className={`step-row ${idx % 2 === 1 ? 'step-row-reverse' : ''}`}
        >
          {/* Text block */}
          <div className="step-content">
            <div
              className="step-num"
              style={{
                background: `linear-gradient(135deg, ${step.accent} 0%, ${step.accent}cc 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {step.num}
            </div>
            <div className="step-title-row">
              <div
                className="step-icon"
                style={{
                  background: `${step.accent}15`,
                  color: step.accent,
                  border: `1px solid ${step.accent}30`,
                }}
              >
                {step.icon}
              </div>
              <h3 className="step-title">{step.title}</h3>
            </div>
            <p className="step-desc">{step.desc}</p>
            <div
              className="step-meta"
              style={{ color: step.accent }}
            >
              <ArrowRight size={14} />
              <span>Étape {step.num}</span>
            </div>
          </div>

          {/* Visual preview */}
          <div className="step-visual">
            <div
              className="step-visual-glow"
              style={{
                background: `radial-gradient(circle, ${step.accent}33 0%, transparent 70%)`,
              }}
            />
            {step.preview}
          </div>

          {/* Timeline dot */}
          <div
            className="timeline-dot"
            style={{
              background: step.accent,
              boxShadow: `0 0 0 6px ${step.accent}20, 0 0 20px ${step.accent}80`,
            }}
          >
            <div className="timeline-dot-inner" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── LandingPage Principale ────────────────────────────────────────────────────
export default function LandingPage() {
  const [markerPos, setMarkerPos] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const mapSectionRef = useRef(null);

  const handleMapClick = useCallback((latlng) => {
    setMarkerPos(latlng);
    setShowModal(true);
  }, []);

  const handleSuccess = (type, message) => {
    setShowModal(false);
    setMarkerPos(null);

    if (type === 'success') {
      setToast({ type: 'success', title: 'Signalement transmis !', message: 'Notre équipe a été notifiée. Merci pour votre contribution.' });
    } else if (type === 'refused') {
      setToast({ type: 'error', title: 'Image non reconnue', message: 'Notre IA n\'a pas détecté de dégradation routière. Réessayez avec une vue plus nette.' });
    } else if (type === 'zone_error') {
      setToast({ type: 'error', title: 'Zone non couverte', message: message });
    } else {
      setToast({ type: 'error', title: 'Erreur', message });
    }
  };

  const scrollToMap = () => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-wrapper">
      {/* ==========================================
          SECTION 1 : HERO (DARK TECH)
      ========================================== */}
      <section
        className="dark-section"
        style={{
          padding: '80px 20px 40px',
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="hero-grid" />

        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '60px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <img src="/logoSIG.png" alt="RouteSignal Logo" style={{ height: '72px', width: 'auto', marginRight: '15px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            RouteSignal
          </span>
        </header>

        {/* Split Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'center',
            flex: 1,
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Left — Text */}
          <div>
            <div
              style={{
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: '20px',
              }}
            >
              <span style={{ color: '#3b82f6', marginRight: '8px' }}>●</span>
              SIGNALEMENT CITOYEN — GRATUIT & ANONYME
            </div>
            <h1 style={{ fontSize: '4rem', lineHeight: '1.1', marginBottom: '20px' }}>
              Ensemble, <br />
              <span className="text-gradient">améliorons</span>
              <br />
              nos routes.
            </h1>
            <p
              style={{
                color: '#94a3b8',
                fontSize: '1.1rem',
                marginBottom: '40px',
                maxWidth: '400px',
                lineHeight: '1.6',
              }}
            >
              Signalez une dégradation en <strong>30 secondes</strong>. Notre IA
              et nos agents s'occupent du reste.
            </p>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  document
                    .getElementById('map-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                }}
              >
                <MapPin size={18} /> Signaler maintenant <ArrowRight size={18} />
              </button>
              <button
                className="btn"
                onClick={() =>
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Comment ça marche ?
              </button>
            </div>
          </div>

          {/* Right — Premium mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroMockup />
          </div>
        </div>

        {/* Glassmorphism stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginTop: '60px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {[
            { title: '< 30s', label: 'Pour signaler' },
            { title: 'IA', label: 'Analyse Automatique' },
            { title: '100%', label: 'Anonyme & Gratuit' },
            { title: '24/7', label: 'Disponible' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card">
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 5px 0' }}>
                {stat.title}
              </h3>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          SECTION 2 : ACTION (CLEAN LIGHT)
      ========================================== */}
      <section className="light-section" id="how-it-works">
        <div style={{ textAlign: 'center', marginBottom: '60px', position: 'relative', zIndex: 2 }}>
          <h4
            style={{
              color: '#3b82f6',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Simple & Rapide
          </h4>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '15px',
            }}
          >
            Comment ça marche ?
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            Trois étapes. Trente secondes. Un impact réel sur votre quotidien.
          </p>
        </div>

        <HowItWorks />

        {/* Carte Premium */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }} id="map-section">
          <h4
            style={{
              color: '#3b82f6',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Carte Interactive
          </h4>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '15px',
            }}
          >
            Signaler maintenant
          </h2>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }} ref={mapSectionRef}>
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              padding: '10px 24px',
              borderRadius: '30px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 9999,
              color: '#3b82f6',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'inline-block',
              }}
            ></span>
            Cliquez sur la carte pour placer un marqueur
          </div>

          <div
            className="premium-map-container"
            style={{ height: '500px', backgroundColor: '#e2e8f0' }}
          >
            <MapContainer
              center={[45.75, 4.85]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl
            >
              <SearchField />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {markerPos && <Marker position={markerPos} />}
            </MapContainer>
          </div>

          <p
            style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '0.85rem',
              marginTop: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Shield size={14} /> Signalement 100% anonyme — aucune donnée
            personnelle requise
          </p>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 : IA & FOOTER (DARK)
      ========================================== */}
      <section
        style={{
          backgroundColor: '#020617',
          color: 'white',
          padding: '80px 20px 30px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 60px',
          }}
        >
          <Activity
            size={40}
            color="#3b82f6"
            style={{ margin: '0 auto 20px', display: 'block' }}
          />
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '20px',
            }}
          >
            Propulsé par l'Intelligence Artificielle
          </h2>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '30px',
            }}
          >
            Chaque photo est analysée instantanément par notre{' '}
            <strong style={{ color: '#60a5fa' }}>Intelligence Artificielle</strong>{' '}
            pour identifier la dégradation et déclencher l'intervention des agents
            au plus vite.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            {[
              'Détection automatique',
              'Score de confiance',
              'Triage instantané',
              'Zéro intervention manuelle',
            ].map((txt) => (
              <span key={txt} className="ai-badge">
                <CheckCircle
                  size={14}
                  style={{ display: 'inline', marginRight: '5px' }}
                  color="#3b82f6"
                />{' '}
                {txt}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: '#475569',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logoSIG.png" alt="RouteSignal Logo" style={{ height: '55px', width: 'auto', objectFit: 'contain' }} />
            RouteSignal © 2026
          </div>

          <div>Projet PFE — Système d'Information Géographique Routier</div>

          <a
            href="/login"
            style={{
              color: '#475569',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'color 0.2s',
            }}
          >
            <Lock size={14} /> ESPACE PROFESSIONNEL
          </a>
        </footer>
      </section>

      {/* Toast notification */}
      {toast && (
        <Toast type={toast.type} title={toast.title} message={toast.message}
          onClose={() => setToast(null)} />
      )}

      {/* Modale signalement */}
      {showModal && markerPos && (
        <ReportModal
          latlng={markerPos}
          onClose={() => { setShowModal(false); setMarkerPos(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
