import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, CheckCircle, Clock, PlusCircle, MapPin, UserCircle, Send, ClipboardList, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AgentDashboard = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [missions, setMissions] = useState([]);
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);

    const [closingMissionId, setClosingMissionId] = useState(null);
    const [observations, setObservations] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [profileRes, missionsRes, inspectionsRes] = await Promise.all([
                axios.get('/api/auth/me', { headers }),
                axios.get('/api/missions', { headers }),
                axios.get('/api/reports/mine', { headers })
            ]);

            setUserProfile(profileRes.data);
            setMissions(missionsRes.data);
            setInspections(inspectionsRes.data);
        } catch (err) {
            console.error("Erreur lors du chargement des données", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateMissionStatus = async (missionId, newStatus, obs = '') => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/reports/${missionId}/status`, 
                { status: newStatus, agentObservations: obs },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
            setClosingMissionId(null);
            setObservations('');
        } catch (err) {
            console.error("Erreur mise à jour mission", err);
            alert("Erreur lors de la mise à jour");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header / Welcome Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100 text-white">
                        <UserCircle size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Bonjour, {userProfile?.firstName || 'Agent'} !
                        </h1>
                        <p className="text-slate-500 font-medium">Prêt à sécuriser la Zone {userProfile?.zone?.join(', ') || '...'} ?</p>
                    </div>
                </div>

                <Link to="/nouveau-signalement" className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-100 active:scale-95 group">
                    <PlusCircle size={22} /> 
                    <span>Nouveau Signalement</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Mes Inspections Récentes Section */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-blue-900 font-black text-lg flex items-center gap-2 uppercase tracking-widest">
                        <Send size={20} className="text-blue-600" />
                        Mes Inspections Récentes
                    </h2>
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100">
                        {inspections.length} Total
                    </span>
                </div>

                <div className="space-y-4">
                    {inspections.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <Camera size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium italic">Vous n'avez pas encore envoyé d'inspections.</p>
                        </div>
                    ) : (
                        inspections.slice(0, 5).map(report => (
                            <div key={report._id} className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between group shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 relative group">
                                        <img 
                                            src={report.images && report.images[0] ? `http://localhost:5000${report.images[0]}` : "https://via.placeholder.com/64"} 
                                            alt="Inspection" 
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                            onError={(e) => e.target.src = "https://via.placeholder.com/64"}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-lg border border-green-100 flex items-center gap-1">
                                                <CheckCircle size={10} /> Validé
                                            </span>
                                            <span className="text-slate-400 text-xs font-medium">
                                                {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                        <h3 className="text-slate-800 font-bold text-lg mb-0.5 line-clamp-1">
                                            {report.description || report.aiClassification?.type || "Signalement de terrain"}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                                            <MapPin size={14} className="text-slate-300" />
                                            {report.address || `${report.city}, ${report.zone}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center text-slate-300 group-hover:text-blue-400 transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Missions à Effectuer Section */}
            <section>
                <h2 className="text-indigo-900 font-black text-lg flex items-center gap-2 uppercase tracking-widest mb-6 px-2">
                    <ClipboardList size={22} className="text-indigo-600" />
                    Missions à Effectuer
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {missions.length === 0 ? (
                        <div className="md:col-span-2 bg-indigo-50/50 rounded-[40px] p-16 text-center border-2 border-indigo-100/50">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle size={40} className="text-indigo-400" />
                            </div>
                            <h3 className="text-slate-800 font-black text-2xl mb-2">Aucune mission urgente</h3>
                            <p className="text-slate-500 font-medium">L'expert n'a pas encore assigné de travaux dans votre zone.</p>
                        </div>
                    ) : (
                        missions.map(mission => (
                            <div key={mission._id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-2 h-full ${mission.status === 'VALIDATED' ? 'bg-indigo-500' : 'bg-amber-400'}`}></div>
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${mission.status === 'VALIDATED' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            Mission #{mission._id.slice(-4)}
                                        </span>
                                        <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wide">
                                            {new Date(mission.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {mission.status !== 'refuse' && (
                                        <div className="bg-red-50 text-red-600 p-2 rounded-xl">
                                            <AlertCircle size={20} />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-2xl font-black text-slate-800 mb-3 leading-tight">
                                        {mission.aiClassification?.type || "Réparation requise"}
                                    </h3>
                                    <p className="text-slate-500 font-medium line-clamp-3">
                                        {mission.description || "Aucun détail fourni."}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                        <MapPin size={18} className="text-slate-300" />
                                        <span>{mission.address || mission.city}</span>
                                    </div>

                                    {mission.status === 'VALIDATED' ? (
                                        <button 
                                            onClick={() => updateMissionStatus(mission._id, 'EN_COURS')}
                                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Clock size={18} /> Commencer
                                        </button>
                                    ) : mission.status === 'EN_COURS' ? (
                                        <div className="space-y-4">
                                            <textarea 
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-medium"
                                                placeholder="Notes finales de réparation..."
                                                rows="2"
                                                value={observations}
                                                onChange={(e) => setObservations(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => updateMissionStatus(mission._id, 'refuse', observations)}
                                                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={18} /> Clôturer la mission
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-green-50 text-green-600 font-bold rounded-2xl border border-green-100">
                                            Mission Terminée
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default AgentDashboard;
