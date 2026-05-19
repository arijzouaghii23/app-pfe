import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, Eye, EyeOff,
  LogOut, Route, Target, Award, BadgeCheck,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const authFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  return res;
};

// ── Notification Toast ─────────────────────────────────────────────────────────
// Declared OUTSIDE Profile to avoid remounting on parent re-render
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

// ── Password Field ─────────────────────────────────────────────────────────────
// CRITICAL: declared OUTSIDE Profile so React never unmounts it on re-render.
// Receives value, onChange, show, onToggle, label, disabled as props.
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
            focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
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
          {/* show=true means password is VISIBLE → show EyeOff to hide it */}
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────
// Also outside Profile for the same reason.
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-violet-200 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────────
export default function Profile() {
  // ── User data ──────────────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Career stats ───────────────────────────────────────────────────────────
  const [careerStats, setCareerStats] = useState({
    impactKm: 0, totalPatrols: 0, efficiency: 0,
    impactProgress: 0, activityProgress: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Password form — flat state, no nested objects that cause stale closures ─
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // ── Visibility toggles ─────────────────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── API state ──────────────────────────────────────────────────────────────
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

  // ── Fetch career stats ─────────────────────────────────────────────────────
  const fetchCareerStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [ordersRes, missionsRes] = await Promise.all([
        authFetch('/api/inspection-orders/mine'),
        authFetch('/api/missions'),
      ]);
      let impactKm = 0, totalPatrols = 0, efficiency = 0;
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        totalPatrols = orders.length;
        impactKm = orders.filter(o => o.status === 'done').length * 8;
      }
      if (missionsRes.ok) {
        const missions = await missionsRes.json();
        if (missions.length > 0) {
          efficiency = Math.round((missions.filter(m => m.status === 'COMPLETED').length / missions.length) * 100);
        }
      }
      setCareerStats({
        impactKm, totalPatrols, efficiency,
        impactProgress: Math.min(Math.round((impactKm / 500) * 100), 100),
        activityProgress: Math.min(Math.round((totalPatrols / 200) * 100), 100),
      });
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); fetchCareerStats(); }, [fetchProfile, fetchCareerStats]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const user = userProfile || localUser;
  const fullName = [user.firstName, user.name].filter(Boolean).join(' ') || 'Utilisateur';
  const initials = fullName.charAt(0).toUpperCase();
  const role = user.role || localUser.role || 'agent';
  const isAgent = role === 'agent';
  const roleLabel = isAgent ? 'Certifié SIG' : 'Ingénieur Senior';
  const roleDescription = isAgent
    ? "Agent Terrain — Système d'Information Géographique"
    : "Systèmes d'Information Géographique";

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <main className="p-8">

        {/* ===== HERO BANNER — Dark Map ===== */}
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ animation: 'fadeIn 0.4s ease-out' }}>

          {/* Map image with fade-out gradient at bottom */}
          <div className="h-48 relative overflow-hidden">
            <img
              src="/map-banner.png"
              alt="Carte SIG"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.85) saturate(1.2)' }}
            />
            {/* Gradient overlay: fades into white at bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.05) 50%, rgba(255,255,255,0.95) 100%)',
              }}
            />
            {/* Subtle violet accent top-right */}
            <div className="absolute top-4 right-20 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-32 w-40 h-16 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Profile info overlaid on white section below */}
          <div className="bg-white border border-slate-100 rounded-b-2xl px-8 pb-6 pt-0 relative">
            {/* Avatar */}
            <div className="absolute -top-14 left-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 text-sm">{roleDescription}</p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">
                    {role === 'admin' ? "Gestionnaire d'Exploitation" : role}{user.assignedCity && user.assignedCity !== '—' ? ` • ${user.assignedCity}` : ''}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===== CAREER STATS ===== */}
        <section className="mb-8" style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Impact */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Route className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Impact</p>
                  {statsLoading
                    ? <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg mt-1" />
                    : <p className="text-2xl font-bold text-slate-900 mt-0.5">{careerStats.impactKm.toLocaleString('fr-FR')} km</p>
                  }
                  <p className="text-xs text-slate-500">de routes sécurisées</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${careerStats.impactProgress}%` }} />
              </div>
            </div>

            {/* Activité */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Activité</p>
                  {statsLoading
                    ? <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-lg mt-1" />
                    : <p className="text-2xl font-bold text-slate-900 mt-0.5">{careerStats.totalPatrols}</p>
                  }
                  <p className="text-xs text-slate-500">Patrouilles effectuées</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${careerStats.activityProgress}%` }} />
              </div>
            </div>

            {/* Efficacité */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Efficacité</p>
                  {statsLoading
                    ? <div className="h-7 w-20 bg-slate-100 animate-pulse rounded-lg mt-1" />
                    : <p className="text-2xl font-bold text-slate-900 mt-0.5">{careerStats.efficiency}%</p>
                  }
                  <p className="text-xs text-slate-500">Missions réussies</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${careerStats.efficiency}%` }} />
              </div>
            </div>

          </div>
        </section>

        {/* ===== TWO COLUMN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}>

          {/* LEFT: Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-500 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <User className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{role === 'admin' ? "Mon Compte - Gestion d'Exploitation" : "Informations Personnelles"}</h2>
                <p className="text-xs text-slate-400">Vos coordonnées et détails</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {profileLoading ? (
                [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)
              ) : (
                <>
                  <InfoRow icon={User} label="Nom Complet" value={fullName} />
                  <InfoRow icon={Mail} label="Adresse Email" value={user.email} />
                  <InfoRow icon={Phone} label="Téléphone" value={user.phone} />
                  <InfoRow icon={MapPin} label="Ville" value={user.assignedCity} />
                  <InfoRow icon={Shield} label="Rôle" value={role === 'admin' ? "Gestionnaire d'Exploitation" : role.charAt(0).toUpperCase() + role.slice(1)} />
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Security */}
          <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-500 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
                <p className="text-xs text-slate-400">Gérez votre mot de passe</p>
              </div>
            </div>

            {/* PasswordField components use FLAT state props — no closures/remounting */}
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

              {/* Hint */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Conseil :</span>{' '}
                  Utilisez au moins 8 caractères avec des majuscules, chiffres et symboles.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium text-sm
                  shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40
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
