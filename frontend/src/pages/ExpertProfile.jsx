import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, Eye, EyeOff,
  LogOut, ClipboardCheck, Layers, TrendingUp, BadgeCheck,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const authFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    ...opts,
    headers: { Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
  return res;
};

// ── Notification Toast ─────────────────────────────────────────────────────────
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const ok = type === 'success';
  return (
    <div className={`fixed top-5 right-5 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-sm
      ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}
    >
      {ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

// ── Password Field — OUTSIDE component to prevent remounting on re-render ──────
function PasswordField({ label, value, onChange, show, onToggle, disabled }) {
  return (
    <div className="relative">
      <label className="absolute -top-2.5 left-3 px-1.5 bg-white text-[10px] uppercase tracking-wider text-slate-400 font-medium z-10">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          required
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
            placeholder:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400
            disabled:bg-slate-50 disabled:cursor-not-allowed
            transition-all duration-200"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
            hover:bg-slate-100 text-slate-400 hover:text-slate-600
            disabled:opacity-50 transition-all"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Info Row — OUTSIDE component ───────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, accent = 'amber' }) {
  const colors = {
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600', hover: 'hover:border-amber-200' },
    violet: { bg: 'bg-violet-100', icon: 'text-violet-600', hover: 'hover:border-violet-200' },
  };
  const c = colors[accent] || colors.amber;
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 ${c.hover} transition-all duration-300`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Expert Profile Page ────────────────────────────────────────────────────────
export default function ExpertProfile() {
  // ── User data ──────────────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Expert career stats ────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    validations: 0,       // rapports validés officiellement (VALIDATED + downstream)
    missionsCreated: 0,   // missions créées (affectées par cet expert)
    closureRate: 0,       // % missions COMPLETED / total missions créées
    validationProgress: 0,
    missionProgress: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Password form — flat state to avoid stale closure remount bug ──────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pwdLoading, setPwdLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // ── Local user fallback ────────────────────────────────────────────────────
  const localUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) setUserProfile(await res.json());
    } catch { /* silent */ }
    finally { setProfileLoading(false); }
  }, []);

  // ── Fetch expert career stats ──────────────────────────────────────────────
  // Expert stats sources:
  //   - /api/reports            → all reports: count VALIDATED/IN_PROGRESS/COMPLETED = validations done
  //   - /api/missions/all       → all missions: filter those COMPLETED vs total = closure rate
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [reportsRes, missionsRes] = await Promise.all([
        authFetch('/api/reports'),
        authFetch('/api/missions/all'),
      ]);

      let validations = 0;
      if (reportsRes.ok) {
        const reports = await reportsRes.json();
        // Validated = reports that passed expert review (any status beyond PENDING_EXPERT)
        validations = reports.filter(r =>
          ['VALIDATED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status)
        ).length;
      }

      let missionsCreated = 0;
      let closureRate = 0;
      if (missionsRes.ok) {
        const missions = await missionsRes.json();
        missionsCreated = missions.length;
        if (missionsCreated > 0) {
          const completed = missions.filter(m => m.status === 'COMPLETED').length;
          closureRate = Math.round((completed / missionsCreated) * 100);
        }
      }

      setStats({
        validations,
        missionsCreated,
        closureRate,
        // Progress bars: validations capped at 100 = 100%, missions capped at 50 = 100%
        validationProgress: Math.min(Math.round((validations / 100) * 100), 100),
        missionProgress: Math.min(Math.round((missionsCreated / 50) * 100), 100),
      });
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); fetchStats(); }, [fetchProfile, fetchStats]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const user = userProfile || localUser;
  const fullName = [user.firstName, user.name].filter(Boolean).join(' ') || 'Utilisateur';
  const initials = fullName.charAt(0).toUpperCase();
  const role = user.role || 'expert';

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ── Password update ────────────────────────────────────────────────────────
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setNotification({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (newPwd.length < 8) {
      setNotification({ type: 'error', message: 'Le mot de passe doit comporter au moins 8 caractères.' });
      return;
    }
    setPwdLoading(true);
    try {
      const res = await authFetch('/api/auth/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la modification.');
      setNotification({ type: 'success', message: 'Mot de passe mis à jour avec succès !' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20">

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <main className="p-8">

        {/* ===== HERO BANNER — Dark Map SIG ===== */}
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="h-48 relative overflow-hidden">
            <img
              src="/map-banner.png"
              alt="Carte SIG Expert"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.8) saturate(1.1) hue-rotate(15deg)' }}
            />
            {/* Amber-tinted gradient for expert (differentiates from agent's violet) */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.05) 50%, rgba(255,255,255,0.97) 100%)',
              }}
            />
            <div className="absolute top-4 right-20 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-32 w-40 h-16 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="bg-white border border-slate-100 rounded-b-2xl px-8 pb-6 pt-0 relative">
            {/* Avatar — amber gradient for expert */}
            <div className="absolute -top-14 left-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center">
                  {profileLoading
                    ? <Loader2 className="w-8 h-8 text-white animate-spin" />
                    : <span className="text-white text-4xl font-bold tracking-tight">{initials}</span>
                  }
                </div>
                {/* Online dot */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
              </div>
            </div>

            {/* Name + role */}
            <div className="ml-40 pt-4">
              {profileLoading ? (
                <div className="flex flex-col gap-2">
                  <div className="h-7 w-48 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-4 w-72 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-3 w-40 bg-slate-100 animate-pulse rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Ingénieur Senior
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 text-sm">
                    Expert en IA & Validation de Signalements Routiers
                  </p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">
                    {role}{user.assignedCity && user.assignedCity !== '—' ? ` • ${user.assignedCity}` : ''}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>



        {/* ===== TWO COLUMN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}>

          {/* LEFT: Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-500 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Informations Personnelles</h2>
                <p className="text-xs text-slate-400">Coordonnées & identité professionnelle</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {profileLoading ? (
                [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)
              ) : (
                <>
                  <InfoRow icon={User} label="Nom Complet" value={fullName} accent="amber" />
                  <InfoRow icon={Mail} label="Adresse Email" value={user.email} accent="amber" />
                  <InfoRow icon={Phone} label="Téléphone" value={user.phone} accent="amber" />
                  <InfoRow icon={MapPin} label="Ville / Zone" value={user.assignedCity} accent="amber" />
                  <InfoRow icon={Shield} label="Niveau d'accès" value="Expert SIG — Ingénieur Senior" accent="amber" />
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Security */}
          <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-500 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
                <p className="text-xs text-slate-400">Gérez votre mot de passe</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-5">
              <PasswordField
                label="Mot de passe actuel"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                show={showCurrent}
                onToggle={() => setShowCurrent(v => !v)}
                disabled={pwdLoading}
              />
              <PasswordField
                label="Nouveau mot de passe"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                disabled={pwdLoading}
              />
              <PasswordField
                label="Confirmer le mot de passe"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                disabled={pwdLoading}
              />

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Conseil :</span>{' '}
                  Utilisez au moins 8 caractères avec des majuscules, chiffres et symboles.
                </p>
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium text-sm
                  shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
                  hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-300 flex items-center justify-center gap-2"
              >
                {pwdLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour...</>
                  : 'Mettre à jour le mot de passe'
                }
              </button>
            </form>
          </div>
        </div>

        {/* ===== LOGOUT ===== */}
        <div className="mt-8 flex justify-end" style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium
              hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/25
              transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion Sécurisée
          </button>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
