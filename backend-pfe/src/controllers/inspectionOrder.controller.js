const InspectionOrder = require('../models/InspectionOrder');
const User = require('../models/User');
const Sector = require('../models/Sector');
const { sendInspectionOrderEmail } = require('../services/mailer');

// POST /api/inspection-orders — Admin crée un ordre d'inspection
exports.createOrder = async (req, res) => {
  try {
    const { agentId, sectorId, instructions, dueDate } = req.body;

    if (!agentId || !sectorId || !dueDate) {
      return res.status(400).json({ message: 'Champs requis manquants (agentId, sectorId, dueDate).' });
    }

    // Vérifier que l'agent existe et est actif
    const agent = await User.findOne({ _id: agentId, role: 'agent', status: 'active' });
    if (!agent) {
      return res.status(404).json({ message: 'Agent introuvable ou inactif.' });
    }

    // règle isBlocked : l'agent a-t-il déjà un ordre pending en cours (globalement) ?
    const existingOrder = await InspectionOrder.findOne({
      agent: agentId,
      status: 'pending'
    });

    if (existingOrder) {
      return res.status(409).json({
        message: `Affectation Impossible — L'agent ${agent.firstName || agent.name} a déjà un ordre en cours.`,
        isBlocked: true
      });
    }

    // Créer l'ordre
    const order = await InspectionOrder.create({
      agent: agentId,
      sentBy: req.user.id,
      sectorId,
      instructions: instructions || '',
      dueDate
    });

    // Envoyer l'email à l'agent
    try { await sendInspectionOrderEmail(agent, order); } catch (mailErr) {
      console.warn('[MAIL] Erreur envoi email :', mailErr.message);
    }

    const populated = await order.populate([
      { path: 'agent', select: 'name firstName email' },
      { path: 'sectorId', select: 'name city' }
    ]);
    res.status(201).json({ message: 'Ordre d\'inspection émis avec succès.', order: populated });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/inspection-orders/agents — Tous les agents actifs avec leur statut isBlocked
exports.getActiveAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', status: 'active' }).select('name firstName email');

    // Pour chaque agent, vérifier s'il a un ordre pending (globalement)
    const agentsWithStatus = await Promise.all(agents.map(async (agent) => {
      const pendingOrder = await InspectionOrder.findOne({ agent: agent._id, status: 'pending' });
      return {
        _id: agent._id,
        name: agent.name,
        firstName: agent.firstName,
        email: agent.email,
        isBlocked: !!pendingOrder
      };
    }));

    res.json(agentsWithStatus);
  } catch (err) {
    console.error('getActiveAgents error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/inspection-orders/mine — Ordres reçus par l'agent connecté
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await InspectionOrder.find({ agent: req.user.id })
      .populate('sentBy', 'name firstName')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Accuser réception d'un ordre (Agent)
// @route   PATCH /api/inspection-orders/:id/acknowledge
// @access  Private (Agent)
exports.acknowledgeOrder = async (req, res) => {
    try {
        const order = await InspectionOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Ordre introuvable" });
        }

        // Vérifier que c'est bien l'agent assigné
        if (order.agent.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorisé" });
        }

        order.status = 'acknowledged';
        await order.save();

        res.status(200).json({
            message: "Réception confirmée",
            order // On renvoie l'ordre pour que le front puisse rediriger avec les infos (Zone, Gouv, Deleg)
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// GET /api/inspection-orders — Tous les ordres (pour admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await InspectionOrder.find()
      .populate('agent', 'name firstName email zone')
      .populate('sentBy', 'name firstName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/inspection-orders/:id/reassign — Réaffecter un ordre (Admin)
exports.reassignOrder = async (req, res) => {
    try {
        const { newAgentId } = req.body;
        if (!newAgentId) return res.status(400).json({ message: "Nouvel agent manquant." });

        const order = await InspectionOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Ordre introuvable." });
        
        if (order.status === 'done') {
            return res.status(400).json({ message: "Impossible de réaffecter un ordre terminé." });
        }

        // Vérifier nouveau agent
        const newAgent = await User.findOne({ _id: newAgentId, role: 'agent', status: 'active' });
        if (!newAgent) return res.status(404).json({ message: 'Nouvel agent introuvable ou inactif.' });

        // Vérification isBlocked pour le nouvel agent
        const existingOrder = await InspectionOrder.findOne({ agent: newAgentId, zone: order.zone, status: 'pending' });
        if (existingOrder) {
             return res.status(409).json({ message: `L'agent ${newAgent.firstName} est déjà occupé dans la zone "${order.zone}".` });
        }

        order.previousAgent = order.agent; // Historique
        order.agent = newAgentId;
        order.status = 'pending'; // Reset status
        
        await order.save();

        // Envoyer l'email au nouvel agent
        await sendInspectionOrderEmail(newAgent, order);

        res.status(200).json({ message: "Ordre réaffecté avec succès.", order });
    } catch (error) {
        console.error('reassignOrder error:', error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// @desc    Clôturer une patrouille (Agent) — Time-Based Patrolling
// @route   PUT /api/inspection-orders/:id/complete
// @access  Private (Agent)
exports.completeOrder = async (req, res) => {
    try {
        // ── Étape 1 : Récupérer l'ordre ──
        const order = await InspectionOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Ordre d'inspection introuvable." });
        }

        // ── Étape 2 : Sécurité — seul l'agent assigné peut clôturer ──
        if (order.agent.toString() !== req.user.id) {
            return res.status(403).json({ message: "Accès refusé : cet ordre ne vous est pas assigné." });
        }

        // ── Étape 3 : Vérifier que l'ordre n'est pas déjà terminé ──
        if (order.status === 'done') {
            return res.status(400).json({ message: "Cet ordre est déjà marqué comme terminé." });
        }

        // ── Étape 4 : Marquer l'ordre comme terminé ──
        order.status = 'done';
        await order.save();
        console.log(`[COMPLETE] Ordre ${order._id} clôturé par l'agent ${req.user.id}`);

        // ── Étape 5 CRUCIALE (Time-Based Patrolling) :
        //    Mettre à jour lastInspectionDate du Secteur concerné ──
        let updatedSector = null;
        if (order.sectorId) {
            updatedSector = await Sector.findById(order.sectorId);
            if (updatedSector) {
                updatedSector.lastInspectionDate = new Date();
                await updatedSector.save();
                console.log(`[SECTOR] lastInspectionDate mis à jour pour le secteur "${updatedSector.name}" (${updatedSector._id})`);
            } else {
                console.warn(`[SECTOR] Secteur ${order.sectorId} introuvable — lastInspectionDate non mis à jour.`);
            }
        }

        // ── Réponse enrichie ──
        res.status(200).json({
            message: `Patrouille terminée ! La zone "${updatedSector?.name || order.sectorId}" est maintenant marquée comme inspecte.`,
            order: {
                _id: order._id,
                status: order.status,
                sectorId: order.sectorId,
                dueDate: order.dueDate
            },
            sector: updatedSector ? {
                _id: updatedSector._id,
                name: updatedSector.name,
                lastInspectionDate: updatedSector.lastInspectionDate
            } : null
        });

    } catch (error) {
        console.error('[completeOrder] Erreur serveur :', error);
        res.status(500).json({ message: "Erreur serveur lors de la clôture de l'ordre.", error: error.message });
    }
};
