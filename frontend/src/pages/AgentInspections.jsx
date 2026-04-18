import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Search, MapPin, Calendar, Compass, 
    ChevronRight, Clock, CheckCircle2, 
    AlertCircle, Filter, X, ExternalLink,
    Bell, ShieldCheck, CheckCircle, Camera, Bot, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyInspectionOrders, acknowledgeInspectionOrder } from '../services/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ---- Inspection Detail Modal Component ----
const InspectionDetailModal = ({ inspection, onClose }) => {
    const hasLocation = inspection.location?.latitude && inspection.location?.longitude;
    const lat = hasLocation ? inspection.location.latitude : null;
    const lon = hasLocation ? inspection.location.longitude : null;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING_EXPERT': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'VALIDATED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const formatStatusLabel = (status) => {
        switch (status) {
            case 'PENDING_EXPERT': return 'Attente Expert';
            case 'VALIDATED': return 'Mission Assignée';
            case 'EN_COURS': return 'En Cours';
            case 'COMPLETED': return 'Mission Terminée';
            default: return status;
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-8 pb-4 border-b border-slate-100">
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{inspection._id}</p>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {inspection.description || 'Signalement sans description'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(inspection.status)}`}>
                            {formatStatusLabel(inspection.status)}
                        </span>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-2xl flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Location Section */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5"><MapPin size={14} /> Localisation</h3>
                        <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 mb-4">
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-base font-black text-slate-800">
                                        {inspection.address || 'Adresse non disponible'}
                                    </p>
                                    {hasLocation && (
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            {parseFloat(lat).toFixed(5)}, {parseFloat(lon).toFixed(5)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mini Map */}
                        {hasLocation ? (
                            <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-md" style={{ height: '280px' }}>
                                <MapContainer
                                    center={[lat, lon]}
                                    zoom={16}
                                    style={{ width: '100%', height: '100%' }}
                                    scrollWheelZoom={false}
                                    zoomControl={false}
                                    attributionControl={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[lat, lon]} icon={redIcon} />
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="rounded-[1.5rem] bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 text-slate-400" style={{ height: '200px' }}>
                                <AlertCircle size={20} />
                                <span className="text-sm font-bold">Coordonnées GPS non disponibles</span>
                            </div>
                        )}

                        {hasLocation && (
                            <a 
                                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase tracking-widest transition-colors"
                            >
                                <ExternalLink size={13} /> Ouvrir dans OpenStreetMap
                            </a>
                        )}
                    </div>

                    {/* Details Section */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5"><ClipboardList size={14} /> Détails du Signalement</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Gouvernorat</p>
                                <p className="text-sm font-black text-slate-700">{inspection.city || '—'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Zone</p>
                                <p className="text-sm font-black text-slate-700">{inspection.zone || '—'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Date</p>
                                <p className="text-sm font-black text-slate-700">
                                    {new Date(inspection.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Photos Section */}
                    {inspection.images && inspection.images.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5"><Camera size={14} /> Photos du Signalement</h3>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {inspection.images.map((img, i) => (
                                    <div key={i} className="shrink-0 w-48 h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img
                                            src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                            alt={`Photo ${i + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Erreur'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Result if available */}
                    {inspection.aiResult && (
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5"><Bot size={14} /> Analyse IA</h3>
                            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider mb-1">Route détectée</p>
                                        <p className="text-sm font-black text-indigo-700 flex items-center gap-1">{inspection.aiResult.estUneRoute ? <><CheckCircle2 size={14} /> Oui</> : <><X size={14}/> Non</>}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider mb-1">Dégradation</p>
                                        <p className="text-sm font-black text-indigo-700 flex items-center gap-1">{inspection.aiResult.estDegradee ? <><CheckCircle2 size={14} /> Oui</> : <><X size={14}/> Non</>}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider mb-1">Confiance</p>
                                        <p className="text-sm font-black text-indigo-700">{inspection.aiResult.scoreConfiance || '—'}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- Inspection Order Card Component ----
const InspectionOrderCard = ({ order, onAcknowledge, onStartInspection }) => {
    const isDone = order.status === 'done';
    const isAcknowledged = order.status === 'acknowledged';
    const isPriority = order.priority === 'haute';
    const orderNum = order._id.slice(-6).toUpperCase();
    const sentBy = order.sentBy ? `${order.sentBy.firstName || ''} ${order.sentBy.name || ''}`.trim() : 'Administration';

    return (
        <div className={`bg-white rounded-[2.5rem] border shadow-sm transition-all duration-300 overflow-hidden
            ${isDone ? 'border-emerald-100 opacity-80' : isPriority ? 'border-red-200 shadow-red-50' : 'border-slate-100'}
        `}>
            {/* Priority stripe */}
            <div className={`h-1.5 w-full ${isDone ? 'bg-emerald-400' : isPriority ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-indigo-400 to-violet-400'}`} />

            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left : info */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{orderNum}</span>
                            {isPriority ? (
                                <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-red-100">
                                    <AlertCircle size={12} /> Haute Priorité
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                                    Priorité Normale
                                </span>
                            )}
                            {isDone ? (
                                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                                    <CheckCircle size={10} /> Terminé (Done)
                                </span>
                            ) : isAcknowledged ? (
                                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-indigo-100">
                                    <CheckCircle size={10} /> Reçu
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-amber-100">
                                    <Clock size={10} /> En attente
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-1 tracking-tight">
                            {order.gouvernorat} — {order.delegation}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold mb-4">
                            <MapPin size={14} className="text-indigo-400" />
                            Zone {order.zone}
                        </div>

                        {order.instructions && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider mb-1">Instructions</p>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{order.instructions}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={12} className="text-slate-300" />
                                Émis par : {sentBy}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-300" />
                                {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        {isDone && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 mt-3 font-black text-[10px] tracking-widest uppercase w-max">
                                <CheckCircle2 size={12} />
                                Réalisé le : {new Date(order.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </div>
                        )}
                    </div>

                    {/* Right : action */}
                    <div className="flex-shrink-0">
                        {!isAcknowledged && !isDone ? (
                            <button
                                onClick={() => onAcknowledge(order._id)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                <CheckCircle size={16} /> Accuser réception
                            </button>
                        ) : isDone ? (
                            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-3.5 rounded-2xl font-black text-sm border border-emerald-200 shadow-sm">
                                <CheckCircle2 size={16} /> Clôturé
                            </div>
                        ) : (
                            <button
                                onClick={() => onStartInspection(order)}
                                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-3.5 rounded-2xl font-black text-sm border border-indigo-200 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <CheckCircle2 size={16} /> Commencer l'inspection
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ---- Main Component ----
const AgentInspections = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('TOUTES');
    const [searchTerm, setSearchTerm] = useState('');
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userZone, setUserZone] = useState('');
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [inspectionOrders, setInspectionOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const token = localStorage.getItem('token');
    const pendingOrdersCount = inspectionOrders.filter(o => o.status === 'pending').length;

    const fetchInspectionOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            const res = await getMyInspectionOrders(token);
            setInspectionOrders(res.data);
        } catch (err) {
            console.error('Erreur chargement ordres:', err);
        } finally {
            setOrdersLoading(false);
        }
    }, [token]);

    const handleAcknowledge = async (orderId) => {
        try {
            const res = await acknowledgeInspectionOrder(orderId, token);
            setInspectionOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'acknowledged' } : o));
            
            // Redirection immédiate vers le formulaire avec les données de l'ordre
            if (res.data.order) {
                navigate('/nouveau-signalement', { state: { order: res.data.order } });
            }
        } catch (err) {
            console.error('Erreur accusé réception:', err);
        }
    };

    const handleStartInspection = (order) => {
        navigate('/nouveau-signalement', { state: { order } });
    };

    useEffect(() => {
        fetchInspectionOrders();
    }, [fetchInspectionOrders]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [reportsRes, profileRes] = await Promise.all([
                    axios.get('/api/reports/mine', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                setInspections(reportsRes.data && reportsRes.data.length > 0 ? reportsRes.data : []);
                if (profileRes.data.zone) {
                    setUserZone(profileRes.data.zone.join(', '));
                }
            } catch (err) {
                console.error("Erreur chargement:", err);
                setInspections([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const tabs = [
        { id: 'ORDERS', label: 'ORDRES REÇUS', count: pendingOrdersCount },
        { id: 'TOUTES', label: 'TOUTES' },
        { id: 'PENDING_EXPERT', label: 'ATTENTE EXPERT' },
        { id: 'VALIDATED', label: 'MISSION' },
        { id: 'COMPLETED', label: 'MISSION TERMINÉE' }
    ];

    const filteredInspections = inspections.filter(item => {
        const matchesTab = activeTab === 'TOUTES' || item.status === activeTab;
        const matchesSearch = item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item._id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING_EXPERT': return 'bg-amber-100/80 text-amber-700 border-amber-200';
            case 'VALIDATED': return 'bg-blue-100/80 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-emerald-100/80 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING_EXPERT': return <Clock size={12} />;
            case 'VALIDATED': return <Compass size={12} />;
            case 'COMPLETED': return <CheckCircle2 size={12} />;
            default: return null;
        }
    };

    const formatStatusLabel = (status) => {
        switch (status) {
            case 'PENDING_EXPERT': return 'ATTENTE EXPERT';
            case 'VALIDATED': return 'MISSION';
            case 'COMPLETED': return 'MISSION TERMINÉE';
            default: return status;
        }
    };

    const getFirstImage = (item) => {
        if (item.images && item.images.length > 0) {
            const img = item.images[0];
            return img.startsWith('http') ? img : `http://localhost:5000${img}`;
        }
        if (item.imagePath) {
            return item.imagePath.startsWith('http') ? item.imagePath : `http://localhost:5000${item.imagePath}`;
        }
        return null;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6">
            {/* Detail Modal */}
            {selectedInspection && (
                <InspectionDetailModal 
                    inspection={selectedInspection} 
                    onClose={() => setSelectedInspection(null)} 
                />
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestion des Inspections Agent</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                            <MapPin size={14} /> Zone {userZone || '—'}
                        </span>
                        <p className="text-slate-500 text-sm font-medium">Suivi de vos signalements, de l'expertise à la réalisation.</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-4 border border-white shadow-xl shadow-slate-200/50 mb-10 flex flex-col lg:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Rechercher une inspection..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-indigo-100 transition-all font-medium text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative whitespace-nowrap px-6 py-3.5 rounded-full text-xs font-black transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                                : tab.id === 'ORDERS' && tab.count > 0
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {tab.id === 'ORDERS' && <Bell size={12} className="inline mr-1.5" />}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Stats */}
            <div className="flex items-center gap-2 mb-6 px-2">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Flux d'activités</span>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-0.5 rounded-lg text-[10px] font-black border border-indigo-100">
                    {filteredInspections.length} DOSSIER(S)
                </span>
            </div>

            {/* ── ORDRES REÇUS ────────────────────────────────────────── */}
            {activeTab === 'ORDERS' && (
                <div className="space-y-5">
                    {ordersLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                        </div>
                    ) : inspectionOrders.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-slate-800 font-bold text-xl">Aucun ordre reçu</h3>
                            <p className="text-slate-400 font-medium mt-2">L'administration n'a pas encore émis d'ordre d'inspection vous concernant.</p>
                        </div>
                    ) : (
                        inspectionOrders.map(order => (
                            <InspectionOrderCard 
                                key={order._id} 
                                order={order} 
                                onAcknowledge={handleAcknowledge} 
                                onStartInspection={handleStartInspection}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Inspections List */}
            {activeTab !== 'ORDERS' && <div className="space-y-6">
                {filteredInspections.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-xl">Aucune inspection trouvée</h3>
                        <p className="text-slate-400 font-medium mt-2">Essayez de modifier vos filtres ou effectuez un nouveau signalement.</p>
                    </div>
                ) : (
                    filteredInspections.map((item) => {
                        const imgSrc = getFirstImage(item);
                        return (
                            <div key={item._id} className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col md:flex-row items-center gap-8 border-l-4" style={{ 
                                borderLeftColor: item.status === 'PENDING_EXPERT' ? '#f59e0b' : item.status === 'VALIDATED' ? '#4f46e5' : '#10b981' 
                            }}>
                                {/* Image Wrapper */}
                                <div className="relative w-full md:w-56 h-44 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 bg-slate-100">
                                    {imgSrc ? (
                                        <img 
                                            src={imgSrc}
                                            alt={item.description}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <AlertCircle size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border backdrop-blur-md flex items-center gap-1.5 ${getStatusStyles(item.status)}`}>
                                            {getStatusIcon(item.status)}
                                            {formatStatusLabel(item.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Info Wrapper */}
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{item._id}</span>
                                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <Calendar size={13} className="text-slate-300" />
                                            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">
                                        {item.description || 'Signalement sans description'}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                            <MapPin size={16} className="text-indigo-400" />
                                            {item.address || `${item.city}, ${item.zone}`}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                            <Filter size={16} className="text-slate-300" />
                                            {item.type || 'Route'}
                                        </div>
                                    </div>
                                </div>

                                {/* Action: Open Detail Modal */}
                                <div className="flex-shrink-0">
                                    <button 
                                        onClick={() => setSelectedInspection(item)}
                                        className="bg-indigo-600 text-white p-5 rounded-3xl shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all duration-300 active:scale-90 flex items-center justify-center"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>}
        </div>
    );
};

export default AgentInspections;
