import React from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, List, LogOut, ShieldAlert, PlusCircle } from 'lucide-react';

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
        const isActive = location.pathname === to;
        return (
            <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Map size={28} color="var(--secondary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>SIG Routier</h2>
                    </div>
                    <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        Connecté en tant que: <br />
                        <strong style={{ color: 'white', textTransform: 'capitalize' }}>{user.role}</strong>
                    </div>
                </div>

                <div className="sidebar-nav">
                    <NavItem to={`/${user.role}`} icon={LayoutDashboard} label="Tableau de Bord" />
                    <NavItem to="/map" icon={Map} label="Carte Interactive" />
                    
                    {/* AJOUTE CECI POUR LE CITOYEN */}
                    {user.role === 'citizen' && (
                        <NavItem to="/citizen" icon={PlusCircle} label="Signaler une Dégradation" />
                    )}

                    {(user.role === 'agent' || user.role === 'expert') && (
                        <NavItem to="/nouveau-signalement" icon={PlusCircle} label="Nouveau Signalement" />
                    )}

                    {user.role === 'expert' && (
                        <NavItem to="/expert" icon={ShieldAlert} label="Validations IA" />
                    )}

                    {(user.role === 'agent' || user.role === 'expert') && (
                        <NavItem to="/inspections" icon={List} label="Inspections" />
                    )}

                    {(user.role === 'admin' || user.role === 'expert') && (
                        <NavItem to="/missions" icon={List} label="Missions Terrain" />
                    )}
                </div>

                <div style={{ padding: '20px' }}>
                    <button
                        onClick={handleLogout}
                        className="btn"
                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
