import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle, XCircle, ChevronLeft, MapPin, Camera, X, CheckSquare, Hammer, Info } from 'lucide-react';
import axios from 'axios';

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

// ── Auto-center Map ──────────────────────────────────────────────────────────
const FitLocationComponent = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
    }
  }, [map, lat, lng]);
  return null;
};

// ── Icône dynamique pour le marqueur ─────────────────────────────────────────
const getCustomIcon = (priority) => {
    let color = '#4f46e5'; // Indigo par défaut
    if (priority === 'Haute') color = '#f97316'; // Orange
    if (priority === 'Urgente') color = '#ef4444'; // Red

    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>`;
    
    return L.icon({
        iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

export default function MissionView({ mission: initialMission, onComplete, onBack }) {
    const [mission, setMission] = useState(initialMission);
    const [toast, setToast] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    // [lon, lat] from GeoJSON
    const lat = mission.location?.coordinates[1];
    const lng = mission.location?.coordinates[0];

    const typeDegradation = mission.expertValidation?.correctedDegradationType || mission.aiResult?.yoloClassName || 'Anomalie';
    const priority = mission.mission?.priority || 'Normale';

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setImage(f);
        setPreview(URL.createObjectURL(f));
    };

    const resetForm = () => {
        setImage(null);
        setPreview(null);
        setComment('');
        setShowProgressModal(false);
        setShowCompleteModal(false);
    };

    const submitAction = async (endpoint, successMessage, isCompletion = false) => {
        if (!image) {
            setToast({ message: "Une photo est obligatoire.", type: 'error' });
            return;
        }
        
        setLoading(true);
        try {
            const form = new FormData();
            form.append('images', image);
            form.append('comment', comment);

            const res = await fetch(`${API}/api/missions/${mission._id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: form
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur serveur');

            setToast({ message: successMessage, type: 'success' });
            
            if (isCompletion) {
                // Clôture: On avertit le parent (AgentDashboard) qui rafraîchira la liste et fermera la vue
                setTimeout(() => {
                    onComplete("Mission clôturée avec succès !");
                }, 1500);
            } else {
                // Avancement: On met à jour l'objet mission localement pour voir le nouvel historique
                setMission(data.report);
                resetForm();
            }

        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
            {/* ── HEADER OVERLAY ── */}
            <div className="absolute top-0 left-0 w-full p-4 z-[1000] flex items-center gap-3">
                <button 
                    onClick={onBack}
                    className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-xl active:scale-95 transition-all border border-white/20"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 bg-white/90 backdrop-blur-md h-12 rounded-2xl shadow-xl flex flex-col justify-center px-4 border border-white/20">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-0.5">RÉPARATION EN COURS</p>
                    <p className="font-bold text-slate-800 text-sm truncate leading-none">{mission.sectorId?.name || mission.city || 'Zone inconnue'}</p>
                </div>
            </div>

            {/* ── CARTE LEAFLET ── */}
            <div className="flex-1 relative">
                <MapContainer 
                    center={[lat || 48.8566, lng || 2.3522]} 
                    zoom={15} 
                    zoomControl={false}
                    className="w-full h-full"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FitLocationComponent lat={lat} lng={lng} />
                    
                    {lat && lng && (
                        <Marker position={[lat, lng]} icon={getCustomIcon(priority)}>
                            <Popup className="rounded-xl overflow-hidden shadow-xl">
                                <div className="text-center font-sans">
                                    <p className="font-black text-xs text-indigo-500 uppercase tracking-widest mb-1 mt-0">Détails</p>
                                    <p className="font-bold text-slate-800 text-sm m-0">Intervention : {typeDegradation}</p>
                                    <span className="inline-block mt-2 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                                        Priorité {priority}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* ── BOTTOM SHEET (PANNEAU LATÉRAL/BAS) ── */}
            <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col z-[1000] relative max-h-[50vh]">
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>
                
                <div className="px-6 pb-2">
                    <h2 className="text-lg font-black text-slate-800 mb-1">Historique des travaux</h2>
                    <p className="text-xs text-slate-500 font-medium">Suivi de la réparation étape par étape.</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    {/* Liste de l'historique */}
                    {(!mission.mission?.history || mission.mission.history.length === 0) ? (
                        <div className="py-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Info size={24} className="mb-2 opacity-50" />
                            <p className="text-xs font-semibold">Aucun avancement enregistré pour l'instant.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {mission.mission.history.map((h, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm z-10 font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        {idx !== mission.mission.history.length - 1 && <div className="flex-1 w-0.5 bg-indigo-50 my-1" />}
                                    </div>
                                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md uppercase tracking-wider">Étape {idx + 1}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(h.date).toLocaleDateString('fr-FR')} - {new Date(h.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-snug mb-3">{h.comment}</p>
                                        {h.imagePath && (
                                            <div className="mt-3 bg-slate-100 rounded-xl p-2 border border-slate-200 shadow-inner flex justify-center">
                                                <img 
                                                    src={`${API}${h.imagePath}`} 
                                                    alt={`Avancement étape ${idx + 1}`} 
                                                    style={{ maxHeight: '250px', width: '100%', objectFit: 'contain', aspectRatio: '16/9', imageRendering: 'auto', borderRadius: '8px', backgroundColor: '#f8fafc' }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Boutons d'Action */}
                <div className="px-6 py-5 bg-white border-t border-slate-100 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setShowProgressModal(true)}
                        className="py-3.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 font-black text-sm transition-all flex flex-col items-center justify-center gap-1 border border-indigo-100"
                    >
                        <Hammer size={18} />
                        <span>Avancement</span>
                    </button>
                    <button 
                        onClick={() => setShowCompleteModal(true)}
                        className="py-3.5 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 active:scale-95 font-black text-sm transition-all flex flex-col items-center justify-center gap-1"
                    >
                        <CheckCircle size={18} />
                        <span>Clôturer</span>
                    </button>
                </div>
            </div>

            {/* ── MODALS (AJOUTER AVANCEMENT / CLOTURER) ── */}
            {(showProgressModal || showCompleteModal) && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-4"
                    style={{ backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}>
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>
                        
                        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <p className={`font-black text-sm flex items-center gap-1.5 ${showCompleteModal ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                    {showCompleteModal ? <CheckCircle size={16} /> : <Hammer size={16} />} 
                                    {showCompleteModal ? 'Clôture de Mission' : 'Nouveau Rapport d\'Avancement'}
                                </p>
                            </div>
                            <button onClick={resetForm} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5">
                            {/* Upload Image */}
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Photo {showCompleteModal ? 'Finale ' : ''}Obligatoire</p>
                                <label className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-colors relative overflow-hidden group
                                    ${image ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                            <CheckCircle size={32} className="text-indigo-600 z-10" />
                                            <span className="text-indigo-700 font-bold text-xs mt-2 z-10">Photo sélectionnée</span>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={32} className="text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                                            <span className="text-slate-600 font-bold text-sm">Prendre une photo</span>
                                            <span className="text-slate-400 font-medium text-xs mt-1 text-center">Travaux effectués</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            {/* Commentaire */}
                            <div className="mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commentaire (Détails)</p>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={showCompleteModal ? "Résultat final des travaux..." : "Description de l'avancement..."}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => {
                                    if (showProgressModal) submitAction('progress', 'Rapport d\'avancement enregistré !');
                                    if (showCompleteModal) submitAction('complete', 'Mission clôturée avec succès !', true);
                                }}
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                                    ${showCompleteModal ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    showCompleteModal ? "Confirmer la Clôture" : "Soumettre l'Avancement"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
