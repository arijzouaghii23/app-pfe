import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { MapPin, Camera, Zap, CheckCircle, XCircle, Bot, Lock, Rocket, X, Check } from 'lucide-react';

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
        onSuccess(data.report?.status === 'refuse' ? 'refused' : 'success', data.message);
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

// ── Section : Comment ça marche ───────────────────────────────────────────────
const steps = [
  {
    icon: <MapPin size={28} className="text-indigo-500" />,
    title: 'Localisez',
    desc: 'Cliquez sur l\'anomalie directement sur la carte interactive. Aucune adresse à taper.',
  },
  {
    icon: <Camera size={28} className="text-indigo-500" />,
    title: 'Photographiez',
    desc: 'Prenez une photo de la dégradation. Notre IA Gemini analyse automatiquement la gravité.',
  },
  {
    icon: <Zap size={28} className="text-indigo-500" />,
    title: 'On s\'en charge',
    desc: 'Votre signalement est transmis instantanément à nos experts et agents de terrain.',
  },
];

// ── Section Statistiques ──────────────────────────────────────────────────────
const stats = [
  { value: '< 30s', label: 'Pour signaler' },
  { value: 'IA', label: 'Analyse automatique' },
  { value: '100%', label: 'Anonyme & Gratuit' },
  { value: '24/7', label: 'Disponible' },
];

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
    <div className="min-h-screen bg-white font-sans">

      {/* ── SECTION HÉROS ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

        {/* Grille de fond décorative */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(99,179,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Cercles lumineux décoratifs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">SIG</span>
            </div>
            <span className="text-white font-black text-lg tracking-tight">RouteSignal</span>
          </div>
          <Link to="/login"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-xl">
            <Lock size={14} /> Espace Pro
          </Link>
        </nav>

        {/* Contenu héros */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 py-16">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Signalement Citoyen — Gratuit & Anonyme
          </div>

          {/* Titre */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 max-w-4xl">
            Ensemble,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              améliorons
            </span>
            {' '}nos routes.
          </h1>

          {/* Sous-titre */}
          <p className="text-slate-400 text-lg md:text-xl font-medium mb-10 max-w-2xl leading-relaxed">
            Signalez une dégradation en{' '}
            <span className="text-white font-bold">30 secondes</span>.
            {' '}Notre IA et nos agents s'occupent du reste.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={scrollToMap}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base rounded-2xl transition-all duration-200 shadow-2xl shadow-blue-900/50 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              <MapPin size={20} />
              <span>Signaler maintenant</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-base rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              Comment ça marche ?
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl w-full">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-black text-white mb-1">{s.value}</p>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chevron animé */}
        <div className="relative z-10 flex justify-center pb-8">
          <button onClick={scrollToMap} className="text-slate-600 hover:text-slate-400 transition-colors animate-bounce">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── SECTION : COMMENT ÇA MARCHE ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-3">Simple & Rapide</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Comment ça marche ?</h2>
            <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
              Trois étapes. Trente secondes. Un impact réel sur votre quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i}
                className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="font-black text-slate-800 text-lg">{step.title}</h3>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION : CARTE DE SIGNALEMENT ────────────────────────────────── */}
      <section ref={mapSectionRef} className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">

          {/* Titre section */}
          <div className="text-center mb-12">
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-3">Carte Interactive</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Signaler maintenant</h2>
            <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
              Cliquez sur la carte à l'endroit exact de la dégradation. Un formulaire s'ouvrira automatiquement.
            </p>
          </div>

          {/* Instruction pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold px-5 py-2.5 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Cliquez sur la carte pour placer un marqueur
            </div>
          </div>

          {/* Carte Leaflet */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200" style={{ height: '520px' }}>
            <MapContainer
              center={[45.75, 4.85]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl
            >
              <SearchField />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {markerPos && <Marker position={markerPos} />}
            </MapContainer>
          </div>

          <p className="text-center text-slate-400 text-sm font-medium mt-4 flex items-center justify-center gap-1.5">
            <Lock size={14} /> Signalement 100% anonyme — aucune donnée personnelle requise
          </p>
        </div>
      </section>

      {/* ── SECTION : BANNIÈRE IA ─────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Bot size={56} className="text-blue-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Propulsé par l'Intelligence Artificielle
          </h2>
          <p className="text-slate-400 text-lg font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            Chaque photo est analysée par <span className="text-blue-400 font-bold">Google Gemini</span> pour détecter
            automatiquement les dégradations routières et prioriser les interventions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Détection automatique', 'Score de confiance', 'Triage instantané', 'Zéro intervention manuelle'].map(tag => (
              <span key={tag} className="bg-white/10 border border-white/10 text-white/70 text-xs font-bold px-4 py-2 rounded-full">
                <span className="flex items-center gap-1"><Check size={12} /> {tag}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">SIG</span>
            </div>
            <span className="text-slate-400 text-sm font-semibold">RouteSignal © 2025</span>
          </div>

          <p className="text-slate-600 text-xs font-medium text-center">
            Projet PFE — Système d'Information Géographique Routier
          </p>

          {/* Accès discret pour l'équipe */}
          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors group"
          >
            <Lock size={14} className="group-hover:rotate-12 transition-transform" />
            <span>Espace Professionnel</span>
          </Link>
        </div>
      </footer>

      {/* Modale signalement */}
      {showModal && markerPos && (
        <ReportModal
          latlng={markerPos}
          onClose={() => { setShowModal(false); setMarkerPos(null); }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast type={toast.type} title={toast.title} message={toast.message}
          onClose={() => setToast(null)} />
      )}
    </div>
  );
}
