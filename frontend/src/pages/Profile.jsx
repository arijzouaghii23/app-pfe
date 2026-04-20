import React, { useState, useEffect } from 'react';
import { User, LogOut, Lock, Mail, MapPin, CheckCircle, Shield, Loader2 } from 'lucide-react';

export default function Profile() {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [status, setStatus] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile/password', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la modification');
      
      setStatus({ type: 'success', message: 'Mot de passe mis à jour avec succès.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 mb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
            <User size={20} className="text-indigo-500" />
            Mon Profil
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Espace administratif de l'agent</p>
        </div>
      </div>

      {/* Garde de chargement */}
      {profileLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      ) : !userProfile ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-xs font-bold mb-6">
          Impossible de charger le profil. Veuillez vous reconnecter.
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
            <span className="text-white font-black text-2xl">{(userProfile.firstName || userProfile.name || 'A')[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-800 text-lg truncate">
              {userProfile.firstName} {userProfile.name}
            </h3>
            {userProfile.email && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg">
                  <Mail size={12} className="text-slate-400" />
                  <span className="truncate max-w-[160px]">{userProfile.email}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl w-fit">
              <MapPin size={12} />
              Ville : {userProfile.assignedCity || 'Non assigné'}
            </div>
          </div>
        </div>
      )}

      {/* Rôle */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            <Shield size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Niveau d'accès</p>
            <p className="text-sm font-black text-slate-700">Agent Terrain (SIG)</p>
          </div>
        </div>
        <CheckCircle size={18} className="text-emerald-500" />
      </div>

      {/* Formulaire Mot de Passe */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
        <h3 className="font-black text-slate-800 text-sm mb-5 flex items-center gap-2">
          <Lock size={16} className="text-slate-400" />
          Sécurité & Mot de passe
        </h3>

        {status && status.type === 'success' && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 flex gap-2 items-center">
            <CheckCircle size={14} /> {status.message}
          </div>
        )}
        {status && status.type === 'error' && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
            {status.message}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Actuel</label>
            <input type="password" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nouveau</label>
              <input type="password" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Confirmer</label>
              <input type="password" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full mt-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black py-3 rounded-xl text-xs transition-all">
            Modifier le mot de passe
          </button>
        </form>
      </div>

      <button onClick={handleLogout} className="w-full py-4 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-black text-sm transition-all flex items-center justify-center gap-2 border border-red-100">
        <LogOut size={16} />
        Déconnexion Sécurisée
      </button>
    </div>
  );
}
