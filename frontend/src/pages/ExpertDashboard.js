import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, PlusCircle, Check, FileText, User, AlertCircle, Save, X, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExpertDashboard = () => {
    const [reports, setReports] = useState([]);
    const [missions, setMissions] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    // States pour la validation/correction
    const [selectedReport, setSelectedReport] = useState(null);
    const [editType, setEditType] = useState('');
    const [editGravity, setEditGravity] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [missionPriority, setMissionPriority] = useState('Normale');

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/reports?status=SOUMIS,VALIDÉ_IA,REJETÉ', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchMissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/missions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMissions(res.data);
        } catch (err) {
            console.error("Erreur missions", err);
        }
    };

    const fetchAgents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/auth/agents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgents(res.data);
        } catch (err) {
            console.error("Erreur agents", err);
        }
    };

    useEffect(() => {
        fetchReports();
        fetchMissions();
        fetchAgents();
    }, []);

    const handleOpenAssign = (report) => {
        setSelectedReport(report);
        setEditType(report.aiClassification?.type || '');
        setEditGravity(report.aiClassification?.gravity || 'modérée');
    };

    const validateAndAssign = async () => {
        if (!selectedAgent) return alert("Veuillez choisir un agent.");

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Valider le rapport (Expert)
            await axios.patch(`/api/reports/${selectedReport._id}/validate`, {
                type: editType,
                gravity: editGravity,
                status: 'VALIDÉ_EXPERT'
            }, { headers });

            // 2. Créer la mission
            await axios.post('/api/missions', {
                reportId: selectedReport._id,
                agentId: selectedAgent,
                priority: missionPriority
            }, { headers });

            alert("Signalement validé et mission créée avec succès !");
            setSelectedReport(null);
            fetchReports();
        } catch (err) {
            alert("Erreur lors du traitement.");
        }
    };

    const generatePDF = (report, stage = 1) => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("RAPPORT D'INSPECTION ROUTIÈRE", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`ID Signalement: ${report._id}`, 20, 40);
        doc.text(`Date: ${new Date(report.createdAt).toLocaleString()}`, 20, 50);
        doc.text(`Ville: ${report.city || 'Non spécifiée'}`, 20, 60);
        doc.text(`Zone: ${report.zone || 'Non spécifiée'}`, 20, 70);

        doc.text("DÉTAILS TECHNIQUE (ANALYSE IA & EXPERT)", 20, 90);
        const tableData = [
            ["Type d'anomalie", report.aiClassification?.type || "Non classifié"],
            ["Gravité", report.aiClassification?.gravity || "Inconnue"],
            ["Confiance IA", `${Math.round((report.aiClassification?.confidence || 0) * 100)}%`],
            ["Statut Actuel", report.status]
        ];

        doc.autoTable({
            startY: 95,
            head: [['Caractéristique', 'Valeur']],
            body: tableData,
        });

        if (stage === 2) {
            // Ajouter les infos de mission si terminées
            // ... logiques simplifiée ici pour la démo
            doc.text("RÉSULTAT INTERVENTION TERRAIN", 20, doc.lastAutoTable.finalY + 20);
            doc.text("L'intervention a été effectuée par l'agent.", 20, doc.lastAutoTable.finalY + 30);
        }

        doc.save(`Rapport_Inspection_${report._id}.pdf`);
    };

    if (loading) return <div style={{ padding: '20px' }}>Chargement...</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tableau de Bord Expert</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Analysez les détections de l'IA et déclenchez des missions terrain officielles.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {reports.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        <Check size={48} color="var(--success)" style={{ margin: '0 auto 20px' }} />
                        <h3>Aucun signalement en attente</h3>
                        <p>L'IA n'a détecté aucune nouvelle anomalie dans vos zones.</p>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <span style={{
                                    fontSize: '0.85rem',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    backgroundColor:
                                        report.status === 'VALIDÉ_IA' ? '#dcfce7' :
                                            report.status === 'REJETÉ' ? '#fee2e2' : '#fef9c3',
                                    color:
                                        report.status === 'VALIDÉ_IA' ? '#166534' :
                                            report.status === 'REJETÉ' ? '#991b1b' : '#854d0e'
                                }}>
                                    <ShieldAlert size={14} />
                                    {report.status === 'VALIDÉ_IA' ? 'APPROUVÉ IA' :
                                        report.status === 'REJETÉ' ? 'REJETÉ IA' : 'ATTENTE IA'}
                                </span>
                                <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                                    Zone: {report.zone || '?'}
                                </span>
                            </div>

                            {report.imagePath && (
                                <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                    <img
                                        src={`http://localhost:5000/${report.imagePath}`}
                                        alt="Détection"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}

                            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Analyse IA :</p>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{report.city || 'Ville?'}</span>
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>
                                    {report.aiClassification?.type || 'Analyse en attente / Erreur'}
                                </h3>
                                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                                    {report.aiClassification ? (
                                        <>
                                            Gravité : <strong style={{ textTransform: 'capitalize', color: report.aiClassification.gravity === 'critique' ? 'var(--danger)' : 'inherit' }}>{report.aiClassification.gravity}</strong> |
                                            Confiance : {Math.round((report.aiClassification.confidence || 0) * 100)}%
                                        </>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Détails techniques non disponibles</span>
                                    )}
                                </p>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', flex: 1 }}>
                                {report.description || 'Aucune description fournie.'}
                            </p>

                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                                <button onClick={() => handleOpenAssign(report)} className="btn btn-primary" style={{ flex: 1 }}>
                                    <PlusCircle size={16} /> Affecter
                                </button>
                                <button onClick={() => generatePDF(report)} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                                    <FileText size={16} /> Rapport
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Validation et Affectation */}
            {selectedReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="var(--text-muted)" />
                        </button>

                        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldAlert color="var(--primary)" /> Validation & Mission
                        </h2>

                        <div style={{ marginBottom: '25px', display: 'flex', gap: '20px' }}>
                            <img src={`http://localhost:5000/${selectedReport.imagePath}`} style={{ width: '150px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} alt="Fix" />
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedReport.city}</p>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedReport.description}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Corriger le type de dégradation (si besoin)</label>
                            <input type="text" className="input-field" value={editType} onChange={(e) => setEditType(e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Gravité confirmée</label>
                                <select className="input-field" value={editGravity} onChange={(e) => setEditGravity(e.target.value)}>
                                    <option value="mineure">Mineure</option>
                                    <option value="modérée">Modérée</option>
                                    <option value="critique">Critique</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priorité Mission</label>
                                <select className="input-field" value={missionPriority} onChange={(e) => setMissionPriority(e.target.value)}>
                                    <option value="Normale">Normale</option>
                                    <option value="Haute">Haute</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Affecter à un agent de la zone</label>
                            <select className="input-field" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                                <option value="">Choisir un agent...</option>
                                {agents.filter(a => !selectedReport.zone || a.zone.includes(selectedReport.zone)).map(agent => (
                                    <option key={agent._id} value={agent._id}>{agent.name} ({agent.email})</option>
                                ))}
                                {agents.length === 0 && <option disabled>Aucun agent disponible</option>}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button onClick={validateAndAssign} className="btn btn-primary" style={{ flex: 1 }}>
                                <Save size={18} /> Valider et Créer Mission
                            </button>
                            <button onClick={() => setSelectedReport(null)} className="btn" style={{ backgroundColor: '#f3f4f6', flex: 1 }}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Suivi des Missions */}
            <div style={{ marginTop: '50px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={24} /> Suivi des Missions Terrain
                </h2>
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID Mission</th>
                                <th style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Agent</th>
                                <th style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ville / Zone</th>
                                <th style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Statut</th>
                                <th style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {missions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune mission active.</td>
                                </tr>
                            ) : (
                                missions.map(mission => (
                                    <tr key={mission._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '15px 20px', fontSize: '0.9rem', fontWeight: '500' }}>#{mission._id.slice(-6)}</td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{mission.agentId?.name || 'Inconnu'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mission.agentId?.email}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{mission.reportId?.city || '?'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zone: {mission.zone}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                backgroundColor: mission.status === 'TERMINÉE' ? '#dcfce7' : mission.status === 'RÉSOLU' ? '#dcfce7' : '#fef9c3',
                                                color: mission.status === 'TERMINÉE' ? '#166534' : mission.status === 'RÉSOLU' ? '#166534' : '#854d0e',
                                                fontWeight: '600'
                                            }}>
                                                {mission.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <button
                                                onClick={() => generatePDF(mission.reportId, 2)}
                                                className="btn"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}
                                            >
                                                <FileText size={14} /> Rapport Final
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpertDashboard;
