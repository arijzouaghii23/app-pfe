import axios from 'axios';

// 1. Connexion (Pour tout le monde : Admin, Expert, Agent)
export const login = async (email, password) => {
    return await axios.post('/api/auth/login', { email, password });
};

// 2. Inscription Publique (Par défaut : crée un AGENT)
export const registerPublic = async (userData) => {
    return await axios.post('/api/auth/register', userData);
};

// 3. Création par l'Admin (Permet de choisir le rôle : Expert ou Admin)
export const registerByAdmin = async (userData, token) => {
    return await axios.post('/api/auth/register', userData, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 4. Mot de passe oublié
export const forgotPassword = async (email) => {
    return await axios.post('/api/auth/forgot-password', { email });
};

// 5. Réinitialiser le mot de passe
export const resetPassword = async (token, newPassword) => {
    return await axios.post(`/api/auth/reset-password/${token}`, { newPassword });
};

// --- AGENT MANAGEMENT (Admin) ---

// 6. Lister les agents en attente
export const getPendingAgents = async (token) => {
    return await axios.get('/api/admin/pending-agents', {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 7. Approuver un agent et lui attribuer une ville
export const approveAgent = async (id, assignedCity, token) => {
    return await axios.put(`/api/admin/approve-agent/${id}`, { assignedCity }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};


// 8. Récupérer le statut actuel
export const getUserStatus = async (token) => {
    return await axios.get('/api/auth/status', {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// --- INSPECTION ORDERS (Admin → Agent) ---

// 9. Récupérer les agents actifs (filtrés par zone, avec statut isBlocked)
export const getActiveAgentsByZone = async (zone, token) => {
    return await axios.get(`/api/inspection-orders/agents${zone ? `?zone=${zone}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 10. Émettre un ordre d'inspection
export const createInspectionOrder = async (data, token) => {
    return await axios.post('/api/inspection-orders', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 11. Ordres reçus par l'agent connecté
export const getMyInspectionOrders = async (token) => {
    return await axios.get('/api/inspection-orders/mine', {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 12. Accuser réception d'un ordre
export const acknowledgeInspectionOrder = async (id, token) => {
    return await axios.patch(`/api/inspection-orders/${id}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 13. Tous les ordres (Pour le tableau de bord Admin)
export const getAllInspectionOrders = async (token) => {
    return await axios.get('/api/inspection-orders', {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 14. Réaffecter un ordre (Admin)
export const reassignInspectionOrder = async (orderId, newAgentId, token) => {
    return await axios.patch(`/api/inspection-orders/${orderId}/reassign`, { newAgentId }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};