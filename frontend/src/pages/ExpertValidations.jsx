import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShieldAlert, PlusCircle, Check, FileText, User, AlertCircle, Save, X, CheckCircle, Edit3, PenTool, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SignatureCanvas from 'react-signature-canvas';

const ExpertValidations = () => {
    const [reports, setReports] = useState([]);
    const [missions, setMissions] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('citizen');
    const [statusFilter, setStatusFilter] = useState('PENDING_EXPERT');
    const [searchTerm, setSearchTerm] = useState('');

    // States pour la validation/correction
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalMode, setModalMode] = useState('validation'); // 'validation' ou 'assign'
    const [pdfUrl, setPdfUrl] = useState('');
    const [editType, setEditType] = useState('');
    const [editRecommendation, setEditRecommendation] = useState('');

    // States pour l'affectation
    const [selectedAgent, setSelectedAgent] = useState('');
    const [missionPriority, setMissionPriority] = useState('Normale');
    const [startDate, setStartDate] = useState('');
    const [estimatedEndDate, setEstimatedEndDate] = useState('');

    const sigCanvas = useRef(null);

    const getImageSrc = (report) => {
        const path = report.imagePath || (report.images && report.images.length > 0 ? report.images[0] : null);
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:image')) return path;
        // Si le chemin commence par un slash, on l'enlève pour éviter http://localhost:5000//uploads/...
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `http://localhost:5000/${cleanPath}`;
    };

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = statusFilter === 'ALL' ? '/api/reports' : `/api/reports?status=${statusFilter}`;
            const res = await axios.get(url, {
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
            const res = await axios.get('http://localhost:5000/api/missions/all', {
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
    }, [statusFilter]);

    useEffect(() => {
        fetchMissions();
        fetchAgents();
    }, []);

    const handleOpenValidation = async (report) => {
        setSelectedReport(report);
        setModalMode('validation');
        // ✅ Priorité : valeurs corrigées par l'expert si elles existent, sinon valeurs de l'IA
        setEditType(
            report.expertValidation?.correctedDegradationType ||
            report.aiResult?.yoloClassName ||
            report.aiClassification?.type ||
            ''
        );
        setEditRecommendation(
            report.expertValidation?.correctedRecommendation ||
            report.aiResult?.businessRecommendation ||
            ''
        );
        await fetchPdfForReport(report._id);
    };

    const fetchPdfForReport = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            // Ajout du paramètre '?t=' avec un timestamp pour forcer le navigateur à ignorer le cache
            const response = await axios.get(`http://localhost:5000/api/reports/${reportId}/pdf?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPdfUrl(url);
        } catch (error) {
            console.error("Erreur PDF:", error);
        }
    };

    const handleUpdateText = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:5000/api/reports/${selectedReport._id}/expert/correct`, {
                correctedDegradationType: editType,
                correctedRecommendation: editRecommendation
            }, { headers: { Authorization: `Bearer ${token}` } });

            // ✅ Mise à jour locale du state React pour rafraîchir l'affichage sans recharger
            const updatedReport = res.data.report;
            setReports(prev => prev.map(r => r._id === updatedReport._id ? updatedReport : r));
            setSelectedReport(updatedReport);

            // Refresh PDF to show changes
            await fetchPdfForReport(selectedReport._id);
            alert('Texte mis à jour avec succès. Le PDF a été régénéré.');
        } catch (error) {
            alert("Erreur lors de la mise à jour du texte.");
        }
    };

    const handleValidateOfficial = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            return alert("Veuillez signer avant de valider.");
        }

        try {
            const signatureData = sigCanvas.current.toDataURL('image/png');
            const token = localStorage.getItem('token');

            await axios.post(`http://localhost:5000/api/reports/${selectedReport._id}/expert/validate`, {
                signatureBase64: signatureData
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert("Rapport validé officiellement.");
            setSelectedReport(null);
            fetchReports();
        } catch (err) {
            alert("Erreur : " + (err.response?.data?.message || err.message));
        }
    };

    const handleOpenAssign = (report) => {
        setSelectedReport(report);
        setModalMode('assign');
    };

    const validateAndAssign = async () => {
        if (!selectedAgent) return alert("Veuillez choisir un agent.");

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Créer la mission
            await axios.post('http://localhost:5000/api/missions', {
                reportId: selectedReport._id,
                agentId: selectedAgent,
                priority: missionPriority,
                startDate: startDate,
                estimatedEndDate: estimatedEndDate
            }, { headers });

            alert("Mission créée avec succès !");
            setSelectedReport(null);
            fetchReports();
            fetchMissions();
        } catch (err) {
            alert("Erreur lors du traitement.");
        }
    };

    const downloadOfficialPDF = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/reports/${reportId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Important pour traiter le fichier binaire
            });

            // Créer un lien temporaire pour forcer le téléchargement du PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport-inspection-${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link); // Nettoyage
        } catch (error) {
            console.error("Erreur lors du téléchargement du PDF :", error);
            alert("Impossible de télécharger le rapport PDF.");
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Chargement...</div>;

    // Filtrage des rapports selon l'onglet actif et la recherche
    const filteredReports = reports
        .filter(r => r.source === activeTab)
        .filter(r => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                (r.city && r.city.toLowerCase().includes(term)) ||
                (r.zone && r.zone.toLowerCase().includes(term)) ||
                (r.description && r.description.toLowerCase().includes(term)) ||
                (r.aiResult?.yoloClassName && r.aiResult.yoloClassName.toLowerCase().includes(term)) ||
                (r._id && r._id.toLowerCase().includes(term))
            );
        });

    return (
        <div style={{ padding: '24px 32px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Validations IA</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Analysez les détections de l'IA et déclenchez des missions terrain officielles.</p>
                </div>
            </div>

            {/* Système d'onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('citizen')}
                    style={{
                        padding: '10px 20px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'citizen' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'citizen' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'citizen' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                    Signalements Citoyens
                </button>
                <button
                    onClick={() => setActiveTab('agent')}
                    style={{
                        padding: '10px 20px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'agent' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'agent' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'agent' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                    Relevés Agents
                </button>
            </div>

            {/* Recherche et Filtres */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                    <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par ID, ville, zone ou description..." 
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="var(--text-muted)" />
                    <select 
                        className="input-field" 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', minWidth: '220px', cursor: 'pointer', backgroundColor: 'white' }}
                    >
                        <option value="PENDING_EXPERT">En attente d'expert</option>
                        <option value="VALIDATED">Validés (en attente d'affectation)</option>
                        <option value="IN_PROGRESS">En cours d'intervention</option>
                        <option value="COMPLETED">Interventions terminées</option>
                        <option value="ALL">Tous les statuts</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {filteredReports.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        <Check size={48} color="var(--success)" style={{ margin: '0 auto 20px' }} />
                        <h3>
                            {statusFilter === 'PENDING_EXPERT' ? 'Félicitations ! Vous avez traité tous les nouveaux signalements.' :
                             statusFilter === 'VALIDATED' ? 'Aucun rapport en attente d\'affectation pour le moment.' :
                             statusFilter === 'IN_PROGRESS' ? 'Aucun chantier de réparation n\'est actuellement actif.' :
                             statusFilter === 'COMPLETED' ? 'L\'historique des travaux terminés est vide.' :
                             'Aucun signalement trouvé'}
                        </h3>
                    </div>
                ) : (
                    filteredReports.map(report => (
                        <div key={report._id} className="card" style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            backgroundColor: 
                                report.status === 'PENDING_EXPERT' ? '#fef9c3' : 
                                report.status === 'VALIDATED' ? '#f0fdf4' : 'white',
                            border: 
                                report.status === 'PENDING_EXPERT' ? '2px solid #eab308' : 
                                report.status === 'VALIDATED' ? '2px solid #22c55e' : '1px solid var(--border-color)',
                            boxShadow: 
                                report.status === 'PENDING_EXPERT' ? '0 4px 6px -1px rgba(234, 179, 8, 0.2)' : 
                                report.status === 'VALIDATED' ? '0 4px 6px -1px rgba(34, 197, 94, 0.15)' : undefined
                        }}>
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
                                        report.status === 'PENDING_EXPERT' ? '#fef3c7' :
                                            report.status === 'VALIDATED' ? '#dcfce7' :
                                                report.status === 'IN_PROGRESS' ? '#dbeafe' :
                                                    report.status === 'COMPLETED' ? '#d1fae5' : '#f3f4f6',
                                    color:
                                        report.status === 'PENDING_EXPERT' ? '#92400e' :
                                            report.status === 'VALIDATED' ? '#15803d' :
                                                report.status === 'IN_PROGRESS' ? '#1e40af' :
                                                    report.status === 'COMPLETED' ? '#166534' : '#374151'
                                }}>
                                    <ShieldAlert size={14} />
                                    {report.status === 'PENDING_EXPERT' ? ' EN ATTENTE EXPERT' :
                                        report.status === 'VALIDATED' ? ' VALIDÉ' :
                                            report.status === 'IN_PROGRESS' ? ' EN COURS' :
                                                report.status === 'COMPLETED' ? ' TERMINÉ' : report.status}
                                </span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: report.source === 'citizen' ? '#eff6ff' : '#ecfdf5', color: report.source === 'citizen' ? '#1d4ed8' : '#047857', border: `1px solid ${report.source === 'citizen' ? '#bfdbfe' : '#a7f3d0'}` }}>
                                        {report.source === 'citizen' ? 'Signalement Citoyen' : 'Relevé Agent'}
                                    </span>
                                    {report.zone && (
                                        <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                                            Zone: {report.zone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ── Méta-infos : date de soumission + identité pour agent ── */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          
                                {/* Identité de l'agent — uniquement pour les relevés agent */}
                                {report.source === 'agent' && report.owner && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                         Par : <strong style={{ color: '#374151' }}>
                                            {report.owner.name || `${report.owner.firstName || ''} ${report.owner.lastName || ''}`.trim() || report.owner.email || `ID: ${typeof report.owner === 'string' ? report.owner : report.owner._id}`}
                                        </strong>
                                    </span>
                                )}
                                      {/* Date de soumission — pour citoyen ET agent */}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                     Soumis le : <strong style={{ color: '#374151' }}>
                                        {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </strong>
                                </span>
                                
                                {/* Info agent pour IN_PROGRESS */}
                                {report.status === 'IN_PROGRESS' && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginTop: '4px' }}>
                                         Actuellement pris en charge par : <strong style={{ color: '#1e40af' }}>
                                            {`${report.assignedTo?.firstName || report.assignedTo?.name || ''} ${report.assignedTo?.lastName || ''}`.trim() || 'Agent'} | ID: {typeof report.assignedTo === 'string' ? report.assignedTo : report.assignedTo?._id || 'Inconnu'}
                                        </strong>
                                    </span>
                                )}

                                {/* Info agent pour COMPLETED */}
                                {report.status === 'COMPLETED' && report.mission && report.mission.history && report.mission.history.length > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginTop: '4px' }}>
                                         Réparation finalisée par : <strong style={{ color: '#166534' }}>
                                            {`${report.assignedTo?.firstName || report.assignedTo?.name || ''} ${report.assignedTo?.lastName || ''}`.trim() || 'Agent'} | ID: {typeof report.assignedTo === 'string' ? report.assignedTo : report.assignedTo?._id || 'Inconnu'}
                                        </strong> avec la date du {new Date(report.mission.history[report.mission.history.length - 1].date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>

                            {getImageSrc(report) && (
                                <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                    <img
                                        src={getImageSrc(report)}
                                        alt="Aperçu du signalement"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            <div style={{ 
                                backgroundColor: report.expertValidation?.correctedDegradationType ? '#f0fdf4' : '#f9fafb', 
                                padding: '15px', 
                                borderRadius: '8px', 
                                marginBottom: '15px', 
                                borderLeft: `4px solid ${report.expertValidation?.correctedDegradationType ? '#22c55e' : 'var(--primary)'}` 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: report.expertValidation?.correctedDegradationType ? '#15803d' : 'var(--text-muted)', fontWeight: '600' }}>
                                        {report.expertValidation?.correctedDegradationType ? ' Analyse corrigée par l\'Expert :' : 'Analyse IA :'}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{report.city || 'Ville?'}</span>
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>
                                    {report.expertValidation?.correctedDegradationType || report.aiResult?.yoloClassName || 'Analyse en attente / Erreur'}
                                </h3>
                                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                                    {(report.expertValidation?.correctedRecommendation || report.aiResult) ? (
                                        <>
                                            Recommandation : <strong style={{ color: report.expertValidation?.correctedRecommendation ? '#15803d' : 'var(--primary)' }}>
                                                {report.expertValidation?.correctedRecommendation || report.aiResult?.businessRecommendation || 'Évaluation en cours'}
                                            </strong>
                                            {!report.expertValidation?.correctedRecommendation && (
                                                <> | Confiance : {report.aiResult?.yoloConfidence ? Math.round(report.aiResult.yoloConfidence * 100) : 0}%</>
                                            )}
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
                                {report.status === 'VALIDATED' && (
                                    <button onClick={() => handleOpenAssign(report)} className="btn btn-primary" style={{ flex: 1 }}>
                                        <PlusCircle size={16} /> Affecter
                                    </button>
                                )}
                                {report.status === 'PENDING_EXPERT' && (
                                    <button onClick={() => handleOpenValidation(report)} className="btn btn-primary" style={{ flex: 1 }}>
                                        <ShieldAlert size={16} /> Voir / Valider
                                    </button>
                                )}
                                {(report.status === 'IN_PROGRESS' || report.status === 'COMPLETED') && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', color: '#6c757d', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        <CheckCircle size={16} style={{ marginRight: '5px' }} />
                                        Expertise terminée
                                    </div>
                                )}
                                <button onClick={() => downloadOfficialPDF(report._id)} className="btn" style={{ flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                                    <FileText size={16} /> Rapport PDF
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Validation et Affectation */}
            {selectedReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: modalMode === 'validation' ? '1100px' : '600px', maxHeight: '95vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: modalMode === 'validation' ? 'row' : 'column', gap: '20px', padding: '30px' }}>

                        <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>
                            <X size={24} color="var(--text-muted)" />
                        </button>

                        {modalMode === 'validation' ? (
                            <>
                                {/* PARTIE A : APERCU PDF */}
                                <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: '20px', display: 'flex', flexDirection: 'column' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', marginTop: 0 }}>
                                        <FileText color="var(--primary)" /> Aperçu du Rapport
                                    </h2>
                                    <div style={{ flex: 1, minHeight: '600px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                                        {pdfUrl ? (
                                            <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }} title="PDF Preview" />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Chargement du PDF...</div>
                                        )}
                                    </div>
                                </div>

                                {/* PARTIE B : CORRECTION ET SIGNATURE */}
                                <div style={{ flex: '0 0 400px', paddingLeft: '10px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', marginTop: 0 }}>
                                        <Edit3 color="var(--primary)" /> Actions Expert
                                    </h2>

                                    {/* Formulaire de Correction */}
                                    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '15px' }}>Correction de l'IA</h3>
                                        <div className="form-group" style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type de dégradation</label>
                                            <input type="text" className="input-field" value={editType} onChange={(e) => setEditType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Recommandation d'intervention</label>
                                            <textarea className="input-field" rows={4} value={editRecommendation} onChange={(e) => setEditRecommendation(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }} />
                                        </div>
                                        <button onClick={handleUpdateText} className="btn" style={{ width: '100%', padding: '10px', backgroundColor: 'white', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
                                            Mettre à jour le texte
                                        </button>
                                    </div>

                                    {/* Zone de Signature */}
                                    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', flex: 1, border: '1px solid var(--border-color)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <PenTool size={18} /> Signature Officielle
                                        </h3>
                                        <div style={{ border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: 'white', marginBottom: '15px' }}>
                                            <SignatureCanvas
                                                ref={sigCanvas}
                                                penColor="black"
                                                canvasProps={{ width: 350, height: 180, className: 'sigCanvas' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                            <button onClick={() => sigCanvas.current.clear()} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                Effacer signature
                                            </button>
                                        </div>

                                        <button onClick={handleValidateOfficial} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--primary)', color: 'white' }}>
                                            <ShieldAlert size={20} /> Valider Officiellement
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '10px', width: '100%' }}>
                                <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                                    <PlusCircle color="var(--primary)" /> Affecter une mission de réparation
                                </h2>

                                <div style={{ marginBottom: '25px', display: 'flex', gap: '20px' }}>
                                    {getImageSrc(selectedReport) && (
                                        <img src={getImageSrc(selectedReport)} style={{ width: '150px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} alt="Aperçu du signalement" />
                                    )}
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedReport.city}</p>
                                        <p style={{ margin: '5px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedReport.description}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Priorité Mission</label>
                                        <select className="input-field" value={missionPriority} onChange={(e) => setMissionPriority(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                            <option value="Normale">Normale</option>
                                            <option value="Haute">Haute</option>
                                            <option value="Urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date de début prévue</label>
                                        <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date de fin estimée</label>
                                        <input type="date" className="input-field" value={estimatedEndDate} onChange={(e) => setEstimatedEndDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Affecter à un agent de la zone</label>
                                    <select className="input-field" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                        <option value="">Choisir un agent...</option>
                                        {agents.filter(a => !selectedReport.zone || a.zone.includes(selectedReport.zone)).map(agent => (
                                            <option key={agent._id} value={agent._id}>
                                                {agent.name} — {agent.activeMissionsCount || 0} mission(s) en cours
                                            </option>
                                        ))}
                                        {agents.length === 0 && <option disabled>Aucun agent disponible</option>}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={validateAndAssign} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--primary)', color: 'white' }}>
                                        <Save size={18} /> Créer la Mission
                                    </button>
                                    <button onClick={() => setSelectedReport(null)} className="btn" style={{ backgroundColor: '#f3f4f6', flex: 1, padding: '12px', fontSize: '1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#4b5563' }}>
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
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
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{mission.assignedTo?.name || mission.assignedTo?.firstName || 'Inconnu'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mission.assignedTo?.email || ''}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{mission.city || mission.sectorId?.city || '?'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zone: {mission.sectorId?.name || mission.zone || '?'}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                backgroundColor: mission.status === 'COMPLETED' ? '#dcfce7' : mission.status === 'IN_PROGRESS' ? '#dbeafe' : '#fef9c3',
                                                color: mission.status === 'COMPLETED' ? '#166534' : mission.status === 'IN_PROGRESS' ? '#1e40af' : '#854d0e',
                                                fontWeight: '600'
                                            }}>
                                                {mission.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <button
                                                onClick={() => downloadOfficialPDF(mission._id)}
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

export default ExpertValidations;
