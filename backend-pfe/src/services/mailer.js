const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (to, token, password = null, role = null) => {
  const link = `http://localhost:5000/api/auth/verify/${token}`;

  let htmlContent = `<p>Cliquez ici pour vérifier votre compte :</p>
                     <a href="${link}">${link}</a>`;

  if (role === 'expert' && password) {
    htmlContent = `
      <h3>Bienvenue sur la plateforme SIG Routier</h3>
      <p>Votre compte Expert a été créé par l'administrateur.</p>
      <ul>
        <li><strong>E-mail :</strong> ${to}</li>
        <li><strong>Mot de passe temporaire :</strong> ${password}</li>
      </ul>
      <p><em>Veuillez cliquer sur le lien ci-dessous pour vérifier votre compte, puis changez votre mot de passe lors de votre première connexion :</em></p>
      <a href="${link}">${link}</a>
    `;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: role === 'expert' ? "Vos identifiants de connexion - SIG Routier" : "Vérification de votre compte",
    html: htmlContent
  });
};

exports.sendResetPasswordEmail = async (to, token) => {
  const link = `http://localhost:3000/reset-password/${token}`;

  const htmlContent = `
    <h3>Réinitialisation de votre mot de passe</h3>
    <p>Vous avez demandé la réinitialisation de votre mot de passe sur SIG Routier.</p>
    <p>Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe (ce lien expire dans une heure) :</p>
    <a href="${link}">${link}</a>
    <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Réinitialisation de votre mot de passe - SIG Routier",
    html: htmlContent
  });
};

exports.sendApprovalEmail = async (user) => {
  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h2 style="color: #10b981;">Félicitations ! Votre compte est activé</h2>
      <p>Bonjour <strong>${user.firstName || user.name}</strong>,</p>
      <p>Nous avons le plaisir de vous informer que votre compte <strong>Agent</strong> sur la plateforme <strong>SIG Routier</strong> a été validé par l'administration.</p>
      <p>Vous pouvez dès maintenant vous connecter pour accéder à votre tableau de bord et commencer vos missions sur le terrain.</p>
      <div style="margin-top: 30px;">
        <a href="http://localhost:3000/login" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Se Connecter</a>
      </div>
      <p style="margin-top: 40px; font-size: 0.8rem; color: #6b7280;">
        Cordialement,<br>
        L'équipe d'administration SIG Routier
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Compte Activé - SIG Routier",
    html: htmlContent
  });
};

exports.sendInspectionOrderEmail = async (agent, order) => {
  const priorityLabel = order.priority === 'haute' ? '🔴 HAUTE PRIORITÉ' : '🟡 Priorité Normale';
  const orderNum = order._id.toString().slice(-6).toUpperCase();

  const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 40px 32px; border-radius: 20px 20px 0 0;">
        <p style="color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">SIG Routier — Administration</p>
        <h1 style="color: white; font-size: 26px; font-weight: 900; margin: 0;"> Ordre d'Inspection #${orderNum}</h1>
        <span style="display: inline-block; margin-top: 12px; background: rgba(255,255,255,0.2); color: white; padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;">${priorityLabel}</span>
      </div>

      <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #475569; font-size: 15px; margin: 0 0 24px;">Bonjour <strong>${agent.firstName || agent.name}</strong>,</p>
        <p style="color: #475569; font-size: 15px; margin: 0 0 28px;">Un nouvel ordre d'inspection vous a été assigné. Veuillez en prendre connaissance et procéder dès que possible.</p>

        <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h3 style="color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 20px;">📍 Localisation de la Mission</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; width: 130px;">Gouvernorat</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 800;">${order.gouvernorat}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Délégation</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 800;">${order.delegation}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Zone</td>
              <td style="padding: 8px 0; color: #4f46e5; font-size: 15px; font-weight: 800;">${order.zone}</td>
            </tr>
          </table>
        </div>

        ${order.instructions ? `
        <div style="background: #eef2ff; border-radius: 16px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
          <p style="color: #4f46e5; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px;">Instructions Spéciales</p>
          <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0; line-height: 1.6;">${order.instructions}</p>
        </div>` : ''}

        <div style="margin-top: 32px; text-align: center;">
          <a href="http://localhost:3000/inspections" style="background: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block;">Accéder à mon espace Agent</a>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 20px 32px; border-radius: 0 0 20px 20px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">SIG Routier — Système de Gestion des Inspections Routières</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: agent.email,
    subject: `[ORDRE D'INSPECTION #${orderNum}] ${order.gouvernorat} — ${order.delegation}`,
    html: htmlContent
  });
};
