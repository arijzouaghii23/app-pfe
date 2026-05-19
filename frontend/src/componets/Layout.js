import React from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, List, LogOut, ShieldAlert, PlusCircle, Home, Wrench, History, User, Users, Target, Clock } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Layout = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user.mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (user.role === 'agent' && user.status === 'pending') {
        return <Navigate to="/wait" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        // Logique pour détecter la route active y compris avec query params
        const currentPath = location.pathname + location.search;
        let isActive = currentPath === to;

        // Gérer le cas par défaut de /agent qui correspond à /agent?tab=home
        if (to === '/agent?tab=home' && currentPath === '/agent') {
            isActive = true;
        }

        // Pour les autres routes sans query param (ex: /map)
        if (to.indexOf('?') === -1 && location.pathname === to && currentPath !== '/agent') {
            isActive = true;
        }

        return (
            <Link
                to={to}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                        ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-white border border-violet-500/30 shadow-lg shadow-violet-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
            >
                <Icon className={cn("w-5 h-5", isActive && "text-violet-400")} />
                {label}
                {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
            </Link>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            {/* Sidebar Slate-950 Atoms Style */}
            <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col shadow-2xl z-50">
                {/* Logo */}
                <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
                    <img src="/logoSIG.png" alt="RouteSignal Logo" className="h-10 w-auto object-contain" />
                    <span className="text-white font-bold text-xl tracking-tight">RouteSignal</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {user.role !== 'agent' && user.role !== 'admin' && (
                        <NavItem to={`/${user.role}`} icon={LayoutDashboard} label="Tableau de Bord" />
                    )}
                    {user.role === 'admin' && (
                        <>
                            <div className="px-4 py-2 mt-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Gestion d'Exploitation</div>
                            <NavItem to="/admin?tab=analytics" icon={LayoutDashboard} label="Tableau de Bord" />
                            <NavItem to="/admin?tab=map" icon={Map} label="Carte & Ordres" />
                            <NavItem to="/admin?tab=team" icon={Users} label="Gestion des Équipes" />
                            <div className="px-4 py-2 mt-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Sécurité & Compte</div>
                            <NavItem to="/admin?tab=profile" icon={User} label="Mon Profil" />
                        </>
                    )}
                    {user.role !== 'admin' && (
                        <NavItem to="/map" icon={Map} label="Carte Interactive" />
                    )}

                    {user.role === 'expert' && (
                        <>
                            <NavItem to="/expert/validations" icon={ShieldAlert} label="Validations IA" />
                            <NavItem to="/expert/profile" icon={User} label="Profil" />
                        </>
                    )}

                    {user.role === 'agent' && (
                        <>
                            <NavItem to="/agent?tab=home" icon={Home} label="Patrouille" />
                            <NavItem to="/agent?tab=missions" icon={Target} label="Missions" />
                            <NavItem to="/agent?tab=history" icon={Clock} label="Historique" />
                            <NavItem to="/agent?tab=profile" icon={User} label="Profil" />
                        </>
                    )}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {user.firstName ? user.firstName[0].toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Connecté en tant que</p>
                            <p className="text-sm text-white font-medium truncate capitalize">{user.role === 'admin' ? "Gestionnaire d'Exploitation" : user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-300 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto bg-slate-50 relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
