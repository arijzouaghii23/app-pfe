import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { MapPin } from 'lucide-react';

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
                    const [resMissions, resReports] = await Promise.all([
                        axios.get('/api/missions', { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get('/api/reports/mine', { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    
                    // Extraire les rapports des missions assignées qui ne sont pas terminées ou résolues
                    const missionsData = resMissions.data
                        .filter(m => m.status !== 'TERMINÉE' && m.status !== 'RÉSOLU' && m.reportId)
                        .map(m => ({
                            ...m.reportId, // Assuming reportId contains the full report object
                            missionStatus: m.status,
                            missionPriority: m.priority
                        }));

                    // Extraire les rapports soumis par l'agent qui ne sont pas encore devenus des missions assignées à cet agent
                    const ownReportsData = resReports.data || [];
                    const missionReportIds = new Set(missionsData.map(m => m._id));
                    const newOwnReports = ownReportsData.filter(r => !missionReportIds.has(r._id) && r.status !== 'REJETÉ');

                    fetchedReports = [...missionsData, ...newOwnReports];
                } else {
                    // Pour expert/admin, on affiche tous les rapports non rejetés
                    const resReports = await axios.get('/api/reports', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchedReports = resReports.data.filter(r => r.status !== 'REJETÉ');
                }

                // Filtrer les rapports pour s'assurer qu'ils ont des coordonnées valides
                const validReports = fetchedReports.filter(r =>
                    r.location &&
                    r.location.latitude !== undefined &&
                    r.location.longitude !== undefined
                );

                // Fetch Sectors as well
                try {
                    const resSectors = await axios.get('/api/sectors', { headers: { Authorization: `Bearer ${token}` } });
                    // Filter sectors if the user is an agent so they only see their assigned city/sector
                    const relevantSectors = actualUser.role === 'agent' 
                        ? resSectors.data.filter(s => s.name === actualUser.assignedCity) 
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
        // Vue Agent (Missions)
        if (report.missionStatus) {
            if (report.missionStatus === 'EN_COURS') return icons.mission_en_cours;
            if (report.missionStatus === 'COMPLETED' || report.missionStatus === 'RÉSOLU') return icons.mission_terminee;
            return icons.mission_assignee;
        }

        // Vue Expert / Admin
        if (report.status === 'PENDING_EXPERT') return icons.nouveau_rapport;
        if (report.status === 'VALIDATED' || report.status === 'ACCEPTED' || report.status === 'accepte') return icons.mission_assignee;

        // Priorité aux rapports validés ou missions actives
        if (report.status === 'VALIDÉ_IA') return icons.critique; // Rouge pour l'alerte IA

        const gravity = report.aiClassification?.gravity;
        if (gravity === 'critique') return icons.critique;
        if (gravity === 'modérée') return icons.modérée;
        if (gravity === 'mineure') return icons.mineure;

        return icons.default;
    };
    if (loading) return <div style={{ padding: '20px' }}>Chargement de la carte...</div>;

    const styleFeature = (feature) => {
        const c = feature.properties.statusColor;
        const fill = c === 'GREEN' ? '#10b981' : c === 'ORANGE' ? '#f59e0b' : '#ef4444';
        return {
            fillColor: fill,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '4',
            fillOpacity: 0.15
        };
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
                    <GeoJSON data={geoData} style={styleFeature} />
                )}


                {reports.map((report) => (
                    <Marker
                        key={report._id}
                        position={[report.location.latitude, report.location.longitude]} // Leaflet attend [Lat, Lng]
                        icon={getIconForReport(report)}
                    >
                        <Popup>
                            <div style={{ padding: '5px' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {report.inspectionOrderId ? <MapPin size={16} /> : null}{report.aiClassification?.type || 'Signalement'}
                                </h3>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                                    <strong>Statut:</strong> <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: '#f3f4f6',
                                        fontWeight: '600'
                                    }}>
                                        {report.missionStatus 
                                            ? `Mission ${report.missionStatus}` 
                                            : (report.status === 'PENDING_EXPERT' ? 'Nouveau Signalement' 
                                            : (report.status === 'VALIDÉ_IA' ? 'Détecté par IA' 
                                            : report.status))}
                                    </span>
                                </p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                                    <strong>Zone:</strong> {report.zone || 'Non assignée'}
                                </p>
                                {report.imagePath && (
                                    <img
                                        src={`http://localhost:5000/${report.imagePath}`}
                                        alt="Dégradation"
                                        style={{ width: '100%', marginTop: '5px', borderRadius: '4px' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
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
