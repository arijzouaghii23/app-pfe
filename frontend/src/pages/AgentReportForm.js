import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Camera, MapPin, CheckCircle, Info, ChevronLeft, UploadCloud,
    AlertTriangle, Loader2, CheckCircle2, AlertCircle,
    Navigation, ChevronDown, Edit3
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// ============================================================
// TUNISIAN ADMINISTRATIVE HIERARCHY
// Zone (agent's zone) → Région → Gouvernorat → Délégation
// ============================================================
const ADMIN_HIERARCHY = {
    "Nord": {
        "Nord-Est": {
            "Ariana": ["Ariana Ville", "Ettadhamen", "Kalaat el-Andalous", "La Soukra", "Mnihla", "Raoued", "Sidi Thabet"],
            "Ben Arous": ["Ben Arous", "Bou Mhel el-Bassatine", "El Mourouj", "Ezzahra", "Fouchana", "Hammam Chott", "Hammam Lif", "Khalidet", "Medina Jedida", "Mégrine", "Mornag", "Nouvelle Médina"],
            "La Manouba": ["Borj El Amri", "Djedeida", "El Battan", "La Manouba", "Manouba", "Oued Ellil", "Tebourba"],
            "Tunis": ["Bab Bhar", "Bab Souika", "Cité El Khadra", "Djebel Jelloud", "El Kabaria", "El Menzah", "El Omrane", "El Ouardia", "Ezzouhour", "Hraïria", "La Goulette", "La Marsa", "Le Bardo", "Sidi El Béchir", "Sidi Hassine"],
            "Nabeul": ["Béni Khalled", "Béni Khiar", "Bou Argoub", "Dar Chaabane El Fehri", "El Haouaria", "El Mida", "Grombalia", "Hammamet", "Kelibia", "Korba", "Menzel Bouzelfa", "Menzel Temime", "Nabeul", "Soliman", "Takelsa"],
            "Zaghouan": ["El Fahs", "Bir Mcherga", "Nadhour", "Saouaf", "Zaghouan", "Zriba"]
        },
        "Nord-Ouest": {
            "Béja": ["Amdoun", "Béja Nord", "Béja Sud", "Goubellat", "Medjez el-Bab", "Nefza", "Téboursouk", "Testour", "Thibar"],
            "Bizerte": ["Bizerte Nord", "Bizerte Sud", "El Alia", "Ghezala", "Ghar El Melh", "Joumine", "Mateur", "Menzel Bourguiba", "Menzel Jemil", "Ras Jebel", "Sejnane", "Tinja", "Utique"],
            "Jendouba": ["Aïn Draham", "Balta-Bou Aouane", "Bou Salem", "Fernana", "Ghardimaou", "Jendouba", "Jendouba Nord", "Oued Mliz", "Tabarka"],
            "Le Kef": ["Dahmani", "El Ksour", "Jerissa", "Kalaat Khasbah", "Kalaat Sinane", "Le Kef Est", "Le Kef Ouest", "Nebeur", "Sers", "Tajerouine"]
        }
    },
    "Centre": {
        "Centre-Est": {
            "Kairouan": ["Bou Hajla", "Chebika", "Cherarda", "El Ala", "Haffouz", "Hajeb El Ayoun", "Kairouan Nord", "Kairouan Sud", "Nasrallah", "Oueslatia", "Sbikha"],
            "Kasserine": ["Ayoun Sbiba", "El Ayoun", "Feriana", "Foussana", "Hassi El Ferid", "Hidra", "Jedelienne", "Kasserine Nord", "Kasserine Sud", "Majel Bel Abbès", "Sbeitla", "Sbiba", "Thala"],
            "Sidi Bouzid": ["Bir El Hafey", "Cebbala Ouled Asker", "Jilma", "Mazzouna", "Meknassy", "Menzel Bouzaiane", "Ouled Haffouz", "Regueb", "Sidi Ali Ben Aoun", "Sidi Bouzid Est", "Sidi Bouzid Ouest", "Souk Jedid"]
        }
    },
    "Est": {
        "Centre-Est": {
            "Mahdia": ["Bou Merdès", "Chebouba", "Chorbane", "El Bradaa", "Essouassi", "Hebira", "Ksour Essef", "La Chebba", "Mahdia", "Melloulèche", "Ouled Chamekh", "Sidi Alouane"],
            "Monastir": ["Bembla", "Beni Hassen", "Jemmal", "Ksar Hellal", "Ksibet el-Mediouni", "Moknine", "Monastir", "Ouerdanine", "Sahline", "Sayada-Lamta-Bou Hajar", "Téboulba", "Zéramdine"],
            "Sfax": ["Agareb", "Bir Ali Ben Khalifa", "El Amra", "El Hencha", "Graïba", "Jebiniana", "Kerkenah", "Kerkennah", "Mahres", "Menzel Chaker", "Sakiet Eddaïer", "Sakiet Ezzit", "Sfax Est", "Sfax Médina", "Sfax Ouest", "Sfax Sud", "Skhira", "Thyna", "Younes"],
            "Sousse": ["Akouda", "Bouficha", "Enfidha", "Erriyadh", "Ezzouhour", "Hammam Sousse", "Hergla", "Kalaa Kebira", "Kalaa Seghira", "Kondar", "Ksibet Thrayet", "M'saken", "Sidi Bou Ali", "Sidi El Héni", "Sousse Jawhara", "Sousse Médina", "Sousse Riadh", "Sousse Sidi Abdelhamid"]
        },
        "Nord-Est": {
            "Nabeul": ["Nabeul", "Hammamet", "Kelibia", "Korba", "Menzel Temime", "Grombalia", "El Haouaria", "Béni Khalled", "Soliman", "Takelsa", "Béni Khiar", "Bou Argoub", "Dar Chaabane El Fehri", "El Mida", "Menzel Bouzelfa"]
        }
    },
    "Ouest": {
        "Nord-Ouest": {
            "Siliana": ["Bargou", "Bou Arada", "El Aroussa", "El Krib", "Garantie", "Kesra", "Makthar", "Rohia", "Sidi Bou Rouis", "Siliana Nord", "Siliana Sud"]
        },
        "Centre-Ouest": {
            "Kasserine": ["Ayoun Sbiba", "El Ayoun", "Feriana", "Foussana", "Hassi El Ferid", "Hidra", "Jedelienne", "Kasserine Nord", "Kasserine Sud", "Majel Bel Abbès", "Sbeitla", "Sbiba", "Thala"],
            "Le Kef": ["Dahmani", "El Ksour", "Jerissa", "Kalaat Khasbah", "Kalaat Sinane", "Le Kef Est", "Le Kef Ouest", "Nebeur", "Sers", "Tajerouine"]
        }
    },
    "Sud": {
        "Sud-Est": {
            "Gabès": ["El Hamma", "Gabès Medina", "Gabès Ouest", "Gabès Sud", "Ghannouch", "Kettana", "Mareth", "Matmata", "Métouia", "Nouvelle Matmata"],
            "Médenine": ["Ben Gardane", "Beni Khedache", "Djerba - Ajim", "Djerba - Houmt Souk", "Djerba - Midoun", "Médenine Nord", "Médenine Sud", "Sidi Makhlouf", "Tataouine Nord"],
            "Tataouine": ["Bir Lahmar", "Dehiba", "Ghomrassen", "Remada", "Smar", "Tataouine Nord", "Tataouine Sud"]
        },
        "Sud-Ouest": {
            "Gabès": ["El Hamma", "Gabès Medina", "Gabès Ouest", "Gabès Sud", "Ghannouch", "Kettana", "Mareth", "Matmata", "Métouia", "Nouvelle Matmata"],
            "Gafsa": ["Belkhir", "El Guettar", "El Ksar", "Gafsa Nord", "Gafsa Sud", "Mdhilla", "Métlaoui", "Moularès", "Redeyef", "Sened", "Sidi Aïch"],
            "Kébili": ["Douz Nord", "Douz Sud", "El Faouar", "Kébili Nord", "Kébili Sud", "Souk Lahad"],
            "Tozeur": ["Degache", "El Hamma du Djerid", "Hazoua", "Nefta", "Tamerza", "Tozeur"]
        }
    }
};

// MapController auto-flies map to new center
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 13, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
};

const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
    return null;
};

// ============================================================
const AgentReportForm = () => {
    const [files, setFiles] = useState([]);
    const [description, setDescription] = useState('');
    const [userZones, setUserZones] = useState([]);

    // Cascade state
    const [zone, setZone] = useState('');          // Agent zone (from profile)
    const [region, setRegion] = useState('');      // Région (Nord-Est, Nord-Ouest, etc.)
    const [gouvernorat, setGouvernorat] = useState(''); // Ex: Béja
    const [delegation, setDelegation] = useState('');   // Ex: Testour

    // Address / map state
    const [addressQuery, setAddressQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
    const [mapZoom, setMapZoom] = useState(5.5);
    const [markerPosition, setMarkerPosition] = useState(null);

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Helper: Find Region from Zone + Gouvernorat in hierarchy
    const findRegion = useCallback((z, gouv) => {
        if (!z || !gouv || !ADMIN_HIERARCHY[z]) return '';
        for (const [regionName, gouvList] of Object.entries(ADMIN_HIERARCHY[z])) {
            if (Object.keys(gouvList).includes(gouv)) return regionName;
        }
        return '';
    }, []);

    // Handle redirection data (Inspection Order)
    useEffect(() => {
        if (location.state?.order) {
            const { zone: ordZone, gouvernorat: ordGouv, delegation: ordDeleg } = location.state.order;
            
            if (ordZone) setZone(ordZone);
            if (ordGouv) {
                setGouvernorat(ordGouv);
                // Auto-detect region to unlock the cascade
                const detectedRegion = findRegion(ordZone, ordGouv);
                if (detectedRegion) setRegion(detectedRegion);
            }
            if (ordDeleg) setDelegation(ordDeleg);

            // Notify user
            setMessage("Remplissage automatique : Ordre d'Inspection détecté.");
        }
    }, [location.state, findRegion]);

    // Computed cascade options
    const regionsForZone = zone ? Object.keys(ADMIN_HIERARCHY[zone] || {}) : [];
    const gouvernoratsForRegion = (zone && region) ? Object.keys(ADMIN_HIERARCHY[zone]?.[region] || {}) : [];
    const delegationsForGouvernorat = (zone && region && gouvernorat)
        ? (ADMIN_HIERARCHY[zone]?.[region]?.[gouvernorat] || [])
        : [];

    // Fetch agent zone from profile
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.zone && res.data.zone.length > 0) {
                    setUserZones(res.data.zone);
                    // Only set default if NOT coming from an order
                    if (!location.state?.order) {
                        setZone(res.data.zone[0]);
                    }
                }
            } catch (err) { console.error("Erreur zones:", err); }
        };
        fetchUserData();
    }, [location.state]);

    // When delegation changes: fly to it
    useEffect(() => {
        if (!delegation) return;
        const flyTo = async () => {
            const query = `${delegation}, ${gouvernorat}, France`;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
                const data = await res.json();
                if (data.length > 0) {
                    setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    setMapZoom(14);
                }
            } catch (e) { console.error("Fly err:", e); }
        };
        flyTo();
        setAddressQuery('');
        setSelectedLocation(null);
        setMarkerPosition(null);
    }, [delegation, gouvernorat]);

    // When gouvernorat changes (but no delegation yet): fly to gouvernorat
    useEffect(() => {
        if (!gouvernorat || delegation) return;
        const flyTo = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(gouvernorat)},+France&format=json&limit=1`);
                const data = await res.json();
                if (data.length > 0) {
                    setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    setMapZoom(12);
                }
            } catch (e) { console.error("Fly err:", e); }
        };
        flyTo();
    }, [gouvernorat]);

    // Map click: reverse geocode
    const handleMapClick = useCallback(async (lat, lon) => {
        setMarkerPosition([lat, lon]);
        setIsReverseGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
            const data = await res.json();
            const addr = data.address || {};
            const street = addr.road || addr.pedestrian || addr.footway || addr.residential || '';
            const streetName = street || `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
            const fullAddress = [streetName, delegation || gouvernorat, gouvernorat, 'France'].filter((v, i, a) => v && a.indexOf(v) === i).join(', ');
            setAddressQuery(streetName);
            setSelectedLocation({ lat, lon, full: fullAddress, short: streetName });
        } catch {
            const fallback = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
            setAddressQuery(fallback);
            setSelectedLocation({ lat, lon, full: `${fallback}, ${delegation || gouvernorat}, France`, short: fallback });
        } finally {
            setIsReverseGeocoding(false);
        }
    }, [delegation, gouvernorat]);

    const handleFile = (e) => {
        const newFiles = Array.from(e.target.files);
        if (files.length + newFiles.length > 3) return alert('3 photos maximum.');
        setFiles([...files, ...newFiles]);
    };
    const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) { setStatus('error'); setMessage('Ajoutez au moins une photo.'); return; }
        if (!selectedLocation) { setStatus('error'); setMessage('Cliquez sur la carte pour indiquer l\'emplacement exact.'); return; }
        if (!gouvernorat) { setStatus('error'); setMessage('Sélectionnez un gouvernorat.'); return; }
        setStatus('loading');
        const formData = new FormData();
        files.forEach(f => formData.append('images', f));
        formData.append('latitude', selectedLocation.lat);
        formData.append('longitude', selectedLocation.lon);
        formData.append('city', gouvernorat);
        formData.append('zone', zone);
        formData.append('description', description);
        formData.append('address', selectedLocation.full);

        // Si on vient d'un ordre d'inspection, on lie le rapport à cet ordre pour le clôturer
        if (location.state?.order?._id) {
            formData.append('inspectionOrderId', location.state.order._id);
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/reports', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
            setStatus('success');
            setTimeout(() => navigate('/agent'), 2000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Erreur lors de l\'envoi.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-xl w-full p-10 bg-white rounded-[2.5rem] shadow-2xl text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">Signalement Envoyé</h2>
                    <p className="text-slate-500 font-medium mb-2">Localisation : <strong>{selectedLocation?.full}</strong></p>
                    <p className="text-slate-400 text-sm">Redirection vers le tableau de bord...</p>
                </div>
            </div>
        );
    }

    const mapIsReady = !!delegation;
    const canSubmit = selectedLocation && !isReverseGeocoding && status !== 'loading';

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                <button onClick={() => navigate('/agent')} className="flex items-center gap-2 text-slate-600 hover:text-[#0F172A] transition mb-8 font-black uppercase tracking-widest text-xs">
                    <ChevronLeft size={16} /> Retour
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 sm:p-12">
                    {status === 'error' && (
                        <div className="bg-red-50 border-2 border-red-100 text-red-800 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8">
                            <AlertTriangle size={20} className="text-red-600 shrink-0" />
                            <span className="font-bold text-sm uppercase tracking-wider">{message}</span>
                        </div>
                    )}

                    {location.state?.order && status === 'idle' && (
                        <div className="bg-indigo-50 border-2 border-indigo-100 text-indigo-800 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 animate-pulse">
                            <Info size={20} className="text-indigo-600 shrink-0" />
                            <span className="font-bold text-sm uppercase tracking-wider">Mission détectée : Les champs ont été pré-remplis pour vous.</span>
                        </div>
                    )}

                    {/* === SECTION 1: Photos === */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">1</div>
                            <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">Preuves Visuelles</h2>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
                            <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase tracking-tighter">Anomalie bien visible au centre de la photo. 3 photos maximum.</p>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {files.length < 3 && (
                                <label className="min-w-[140px] h-[140px] border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all bg-slate-50 shrink-0 group">
                                    <UploadCloud size={32} className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider group-hover:text-indigo-600">Ajouter</span>
                                    <input type="file" hidden multiple accept="image/*" onChange={handleFile} />
                                </label>
                            )}
                            {files.map((f, i) => (
                                <div key={i} className="relative min-w-[140px] h-[140px] rounded-3xl overflow-hidden border-2 border-slate-200 shrink-0 shadow-sm">
                                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="prev" />
                                    <button type="button" onClick={() => removeFile(i)} className="absolute top-2 right-2 bg-white/90 text-red-600 w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-red-600 hover:text-white transition-colors"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* === SECTION 2: Administrative Localisation === */}
                    <div className="border-t-2 border-slate-50 pt-12 mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">2</div>
                            <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">Localisation Administrative</h2>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-14 mb-8">
                            Zone → Région → Gouvernorat → Délégation → Clic sur la carte
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* === Cascade Selects (4 étapes) === */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

                            {/* Étape 1: Zone */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0">1</span>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Zone d'intervention</label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={zone}
                                        onChange={(e) => { setZone(e.target.value); setRegion(''); setGouvernorat(''); setDelegation(''); setSelectedLocation(null); setMarkerPosition(null); setMapCenter([46.603354, 1.888334]); setMapZoom(5.5); }}
                                        className="w-full appearance-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-[#0F172A] focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Ma zone...</option>
                                        {userZones.map(z => <option key={z} value={z}>Zone {z}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Étape 2: Région */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0">2</span>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Région</label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={region}
                                        onChange={(e) => { setRegion(e.target.value); setGouvernorat(''); setDelegation(''); setSelectedLocation(null); setMarkerPosition(null); }}
                                        disabled={!zone || regionsForZone.length === 0}
                                        className="w-full appearance-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-[#0F172A] focus:border-indigo-500 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <option value="" disabled>{zone ? 'Choisir région...' : '← Choisir zone'}</option>
                                        {regionsForZone.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Étape 3: Gouvernorat */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-indigo-400 rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0">3</span>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Gouvernorat</label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={gouvernorat}
                                        onChange={(e) => { setGouvernorat(e.target.value); setDelegation(''); setSelectedLocation(null); setMarkerPosition(null); }}
                                        disabled={!region || gouvernoratsForRegion.length === 0}
                                        className="w-full appearance-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-[#0F172A] focus:border-indigo-500 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <option value="" disabled>{region ? 'Choisir gouvernorat...' : '← Choisir région'}</option>
                                        {gouvernoratsForRegion.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Étape 4: Délégation */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-indigo-300 rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0">4</span>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Délégation / Commune</label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={delegation}
                                        onChange={(e) => { setDelegation(e.target.value); setSelectedLocation(null); setMarkerPosition(null); }}
                                        disabled={!gouvernorat || delegationsForGouvernorat.length === 0}
                                        className="w-full appearance-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-[#0F172A] focus:border-indigo-500 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <option value="" disabled>{gouvernorat ? 'Choisir délégation...' : '← Choisir gouvernorat'}</option>
                                        {delegationsForGouvernorat.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="flex items-center gap-2 mb-8 px-1">
                            {[zone, region, gouvernorat, delegation].map((v, i) => (
                                <React.Fragment key={i}>
                                    <div className={`w-2 h-2 rounded-full transition-all ${v ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
                                    {i < 3 && <div className={`flex-1 h-0.5 transition-all ${v ? 'bg-indigo-200' : 'bg-slate-100'}`} />}
                                </React.Fragment>
                            ))}
                            <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                {!zone ? 'Choisir zone' : !region ? 'Choisir région' : !gouvernorat ? 'Choisir gouvernorat' : !delegation ? 'Choisir délégation' : 'Prêt, cliquez sur la carte'}
                            </span>
                        </div>

                        {/* === Map + Address + Description === */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">

                            {/* Map */}
                            <div className="lg:col-span-3 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    5. Cliquer sur la carte → l'adresse s'enregistre automatiquement
                                </label>
                                <div className={`rounded-[1.5rem] overflow-hidden border-2 transition-all shadow-lg ${!mapIsReady ? 'border-slate-200' : selectedLocation ? 'border-emerald-400 shadow-emerald-100' : 'border-indigo-300 shadow-indigo-50'
                                    }`} style={{ height: '380px' }}>
                                    {!mapIsReady ? (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400">
                                            <MapPin size={48} className="opacity-20" />
                                            <div className="text-center">
                                                <p className="text-xs font-black uppercase tracking-widest mb-1">Sélectionnez une délégation</p>
                                                <p className="text-[10px] font-medium">La carte se positionnera automatiquement</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
                                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapController center={mapCenter} zoom={mapZoom} />
                                            <MapClickHandler onMapClick={handleMapClick} />
                                            {markerPosition && <Marker position={markerPosition} icon={redIcon} />}
                                        </MapContainer>
                                    )}
                                </div>
                                {mapIsReady && !selectedLocation && (
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliquez sur la rue endommagée</span>
                                    </div>
                                )}
                            </div>

                            {/* Right col: address result + description + submit */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {/* Address result */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">6. Adresse capturée</label>
                                    <div className={`p-5 rounded-[1.5rem] border-2 transition-all min-h-[100px] flex flex-col justify-center ${isReverseGeocoding ? 'border-indigo-300 bg-indigo-50/30' :
                                            selectedLocation ? 'border-emerald-400 bg-emerald-50/30' :
                                                'border-slate-100 bg-slate-50'
                                        }`}>
                                        {isReverseGeocoding ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 size={18} className="animate-spin text-indigo-500" />
                                                <span className="text-sm font-bold text-indigo-600">Identification de la rue...</span>
                                            </div>
                                        ) : selectedLocation ? (
                                            <>
                                                <div className="flex items-start gap-2 mb-2">
                                                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                                    <p className="text-sm font-black text-slate-800 leading-snug">{selectedLocation.full}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                        {parseFloat(selectedLocation.lat).toFixed(5)}, {parseFloat(selectedLocation.lon).toFixed(5)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-emerald-100 pt-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Corriger le nom de rue :</label>
                                                    <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                                                        <Edit3 size={12} className="text-slate-400 shrink-0" />
                                                        <input
                                                            type="text"
                                                            value={addressQuery}
                                                            onChange={(e) => {
                                                                setAddressQuery(e.target.value);
                                                                setSelectedLocation(prev => ({
                                                                    ...prev,
                                                                    full: [e.target.value, delegation, gouvernorat, 'France'].filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
                                                                    short: e.target.value
                                                                }));
                                                            }}
                                                            className="flex-1 text-xs font-bold text-slate-700 outline-none bg-transparent"
                                                            placeholder="Nom de la rue..."
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <AlertCircle size={16} className="text-amber-400" />
                                                <span className="text-xs font-bold">En attente d'un clic sur la carte...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">7. Description (optionnelle)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Type de dégradation, dangerosité pour les usagers..."
                                        className="flex-1 w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold text-[#0F172A] outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium resize-none min-h-[120px]"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 ${!canSubmit
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-[#0F172A] text-white hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-indigo-200 active:scale-95'
                                            }`}
                                    >
                                        {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <><Navigation size={18} /> Soumettre le signalement</>}
                                    </button>
                                    <p className="text-[9px] text-center text-slate-400 font-black px-4 leading-relaxed uppercase tracking-widest">
                                        Données pour l'amélioration du réseau routier français
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgentReportForm;
