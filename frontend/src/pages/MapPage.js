import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { MapPin, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix pour les icônes Leaflet dans React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icônes personnalisées selon la gravité
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

const icons = {
    critique: createCustomIcon('var(--danger)'),
    modérée: createCustomIcon('var(--secondary)'),
    mineure: createCustomIcon('var(--primary)'),
    default: createCustomIcon('var(--text-muted)'),
    nouveau_rapport: createCustomIcon('#ef4444'), // Rouge
    mission_assignee: createCustomIcon('#f59e0b'), // Orange/Ambre
    mission_en_cours: createCustomIcon('#3b82f6'), // Bleu
    mission_terminee: createCustomIcon('#10b981')  // Vert
};


const MapPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [geoData, setGeoData] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const navigate = useNavigate();

    // Coordonnées et limites de la France pour la précision
    const center = [46.603354, 1.888334];
    const zoom = 5.5;
    const franceBounds = [
        [41.0, -5.5], // Sud-Ouest
        [51.5, 9.6]  // Nord-Est
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
                
                let actualUser = userLocal;
                
                // On récupère le profil complet pour avoir accès au tableau 'zone' mis à jour
                try {
                    const profileRes = await axios.get('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    actualUser = profileRes.data;
                } catch (e) {
                    console.error("Erreur récupération profil dans la carte", e);
                }

                let fetchedReports = [];

                // Si c'est un agent, on récupère ses missions pour afficher les points correspondants
                if (actualUser.role === 'agent') {
                    const [resMissions, resReports, resOrders] = await Promise.all([
                        axios.get('/api/missions', { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get('/api/reports/mine', { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get('/api/inspection-orders/mine', { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    
                    // Récupérer les ordres d'inspection actifs pour l'effet gyrophare
                    const pendingOrders = resOrders.data.filter(o => o.status === 'pending' || o.status === 'acknowledged' || o.status === 'IN_PROGRESS');
                    setActiveOrders(pendingOrders);

                    // === MISSIONS DE L'AGENT : source unique de vérité pour les couleurs ===
                    // On affiche TOUTES les missions assignées à cet agent (IN_PROGRESS + COMPLETED)
                    // Ces points seront : Orange (nouvelle), Bleu (en cours), Vert (terminée)
                    const missionsData = resMissions.data
                        .map(m => ({
                            ...m,
                            missionObj: m,
                            missionStatus: m.status,  // IN_PROGRESS ou COMPLETED — direct, sans dérivation
                            missionPriority: m.mission ? m.mission.priority : 'Normale'
                        }));

                    // === RAPPORTS SOUMIS PAR L'AGENT (non encore missions assignées à lui) ===
                    // On n'affiche QUE les rapports en attente de traitement (PENDING_EXPERT, VALIDATED)
                    // JAMAIS les rapports IN_PROGRESS/COMPLETED car ce sont des missions d'autres agents → pas de faux verts
                    const ownReportsData = resReports.data || [];
                    const missionReportIds = new Set(missionsData.map(m => m._id));
                    const pendingOwnReports = ownReportsData.filter(r =>
                        !missionReportIds.has(r._id) &&
                        (r.status === 'PENDING_EXPERT')
                    );

                    fetchedReports = [...missionsData, ...pendingOwnReports];
                } else {
                    // Pour expert/admin, on affiche tous les rapports non rejetés
                    const resReports = await axios.get('/api/reports', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchedReports = resReports.data.filter(r => r.status !== 'REJECTED');
                }

                // Filtrer les rapports pour s'assurer qu'ils ont des coordonnées valides (GeoJSON ou lat/lng)
                const validReports = fetchedReports.filter(r =>
                    r.location &&
                    (
                        (r.location.latitude !== undefined && r.location.longitude !== undefined) ||
                        (r.location.coordinates && r.location.coordinates.length >= 2)
                    )
                );

                // Fetch Sectors as well
                try {
                    const resSectors = await axios.get('/api/sectors', { headers: { Authorization: `Bearer ${token}` } });
                    // Filter sectors if the user is an agent so they only see their assigned city/sector
                    const relevantSectors = actualUser.role === 'agent' 
                        ? resSectors.data.filter(s => s.city === actualUser.assignedCity || !actualUser.assignedCity) 
                        : resSectors.data;
                    
                    const featureCollection = {
                        type: 'FeatureCollection',
                        features: relevantSectors.map(s => ({
                            type: 'Feature',
                            properties: { _id: s._id, name: s.name, statusColor: s.statusColor || 'RED' },
                            geometry: s.geometry
                        }))
                    };
                    setGeoData(featureCollection);
                } catch (e) {
                    console.error("Erreur récupération secteurs :", e);
                }

                setReports(validReports);
                setLoading(false);
            } catch (err) {
                console.error("Erreur lors du chargement de la carte", err);
                setLoading(false);
            }
        };

        fetchData();


    }, []);

    const getIconForReport = (report) => {
        // Vue Agent — ses missions assignées (missionStatus = IN_PROGRESS ou COMPLETED)
        if (report.missionStatus) {
            if (report.missionStatus === 'COMPLETED')   return icons.mission_terminee; // Vert
            if (report.missionStatus === 'IN_PROGRESS') return icons.mission_en_cours; // Bleu
            return icons.mission_assignee; // Orange (fallback)
        }

        // Vue Expert / Admin — mapping sur les 5 statuts officiels
        if (report.status === 'PENDING_EXPERT') return icons.nouveau_rapport;   // Rouge
        if (report.status === 'VALIDATED')      return icons.mission_assignee;  // Orange
        if (report.status === 'IN_PROGRESS')    return icons.mission_en_cours;  // Bleu
        if (report.status === 'COMPLETED')      return icons.mission_terminee;  // Vert
        if (report.status === 'REJECTED')       return icons.default;

        const gravity = report.aiClassification?.gravity;
        if (gravity === 'critique') return icons.critique;
        if (gravity === 'modérée')  return icons.modérée;
        if (gravity === 'mineure')  return icons.mineure;

        return icons.default;
    };
    if (loading) return <div style={{ padding: '20px' }}>Chargement de la carte...</div>;

    const styleFeature = (feature) => {
        // Tâche 2 : Effet gyrophare pour les ordres d'inspection urgents de l'agent
        const hasActiveOrder = activeOrders.some(o => 
            o.sectorId === feature.properties._id || 
            (o.sectorId && o.sectorId._id === feature.properties._id)
        );

        if (hasActiveOrder) {
            return {
                fillColor: 'red',
                weight: 3,
                opacity: 1,
                color: 'darkred',
                dashArray: '4',
                fillOpacity: 0.8,
                className: 'flashing-sector'
            };
        }

        // Tâche 1 : Couleur neutre pour les secteurs assignés sans ordre actif
        return {
            fillColor: '#94a3b8',
            weight: 2,
            opacity: 0.8,
            color: '#64748b',
            dashArray: '4',
            fillOpacity: 0.2
        };
    };

    // Tâche 1 : Composant pour centrer automatiquement sur les secteurs
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

    return (
        <div style={{ height: 'calc(100vh - 60px)', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                minZoom={6}
                maxBounds={franceBounds}
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Rendu des Secteurs GeoJSON */}
                {geoData && geoData.features.length > 0 && (
                    <>
                        <FitBoundsComponent data={geoData} />
                        <GeoJSON data={geoData} style={styleFeature} />
                    </>
                )}


                {reports.map((report) => (
                    <Marker
                        key={report._id}
                        position={
                            report.location.coordinates 
                                ? [report.location.coordinates[1], report.location.coordinates[0]] // GeoJSON [lon, lat] -> Leaflet [lat, lon]
                                : [report.location.latitude, report.location.longitude]
                        }
                        icon={getIconForReport(report)}
                    >
                        <Popup>
                            <div style={{ padding: '5px' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {report.inspectionOrderId ? <MapPin size={16} /> : null}
                                    {report.missionStatus === 'IN_PROGRESS' 
                                        ? 'Votre Mission en cours'
                                        : report.missionStatus === 'COMPLETED'
                                            ? 'Votre Mission terminée'
                                            : report.missionStatus === 'ASSIGNED'
                                                ? 'Nouvelle Mission (À démarrer)'
                                                : report.status === 'IN_PROGRESS'
                                                    ? 'Mission en cours de réparation'
                                                    : report.status === 'COMPLETED'
                                                        ? 'Réparation terminée'
                                                        : report.status === 'VALIDATED'
                                                            ? 'Prêt pour Affectation'
                                                            : (report.expertValidation?.correctedDegradationType || report.aiClassification?.type || 'Signalement')}
                                </h3>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                                    <strong>Statut:</strong> <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: '#f3f4f6',
                                        fontWeight: '600'
                                    }}>
                                        {report.missionStatus 
                                            ? (report.missionStatus === 'IN_PROGRESS' ? 'En cours (Action requise)'
                                            : report.missionStatus === 'COMPLETED'    ? 'Mission Terminée'
                                            : 'Nouvelle Mission (Attente démarrage)')
                                            : (report.status === 'PENDING_EXPERT' ? 'En attente expert'
                                            : report.status === 'VALIDATED'       ? 'Prêt pour affectation'
                                            : report.status === 'IN_PROGRESS'     ? 'En cours de réparation'
                                            : report.status === 'COMPLETED'       ? 'Terminé'
                                            : report.status === 'REJECTED'        ? 'Rejeté'
                                            : report.status)}
                                    </span>
                                </p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                                    <strong>Adresse:</strong> {report.address || (report.location && report.location.coordinates ? `Lat: ${report.location.coordinates[1].toFixed(5)}, Lng: ${report.location.coordinates[0].toFixed(5)}` : 'Non assignée')}
                                </p>
                                {report.imagePath && (
                                    <img
                                        src={`http://localhost:5000/${report.imagePath}`}
                                        alt="Dégradation"
                                        style={{ width: '100%', marginTop: '5px', borderRadius: '4px' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                )}
                                
                                {report.missionStatus && report.missionStatus !== 'COMPLETED' && report.missionObj && (
                                    <button 
                                        onClick={() => navigate('/agent', { state: { startMission: report.missionObj } })}
                                        className="btn btn-primary" 
                                        style={{ marginTop: '15px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: report.missionStatus === 'ASSIGNED' ? '#f59e0b' : '#3b82f6', border: 'none', color: 'white', fontWeight: 'bold' }}
                                    >
                                        <Wrench size={16} /> {report.missionStatus === 'ASSIGNED' ? "Démarrer la réparation" : "Continuer la réparation"}
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapPage;
