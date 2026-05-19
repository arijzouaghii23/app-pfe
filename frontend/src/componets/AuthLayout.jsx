import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AuthLayout = ({ children }) => {
  // Coordonnées pour une route sinueuse
  const roadPath = [
    [33.5850, -7.6100],
    [33.5870, -7.6050],
    [33.5900, -7.6020],
    [33.5920, -7.5950],
    [33.5930, -7.5900],
    [33.5910, -7.5850],
    [33.5930, -7.5800],
    [33.5960, -7.5750],
    [33.5990, -7.5720],
  ];

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#020617] font-sans">
      
      {/* --- MOCKUP TABLETTE EN 3D (Arrière-plan immersif) --- */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        
        {/* Conteneur 3D de la tablette */}
        <div 
          className="relative w-[130vw] h-[130vh] lg:w-[110vw] lg:h-[110vh] rounded-[3rem] border-[12px] border-slate-800 shadow-[0_0_150px_rgba(0,0,0,0.9)] overflow-hidden bg-slate-900"
          style={{
            transform: 'perspective(1800px) rotateX(55deg) rotateZ(-20deg) translateY(-5%) translateX(-15%)',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center'
          }}
        >
            {/* Top bar de la tablette */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-slate-950 flex items-center px-8 gap-3 z-50 border-b border-slate-800 shadow-xl">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="ml-4 text-slate-300 text-xs font-bold tracking-[0.2em] uppercase">RouteSignal // Terminal Ops</span>
            </div>

            {/* Zone d'affichage de la carte géographique */}
            <div className="absolute top-12 bottom-0 left-0 right-0 z-10 bg-[#0b1120]">
                {/* Filtre CSS extrême pour transformer le satellite en Dark Matter (Bleu/Gris profond) */}
                <div className="w-full h-full [&>.leaflet-container]:bg-[#0b1120]" style={{ filter: 'brightness(0.8) contrast(1.1) saturate(0.8)' }}>
                    <MapContainer 
                        center={[33.5910, -7.5950]} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        dragging={false}
                    >
                        {/* Tuiles Satellite Esri World Imagery */}
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        
                        {/* Tracé de la route IA (Lueur Cyan + Cœur blanc) */}
                        <Polyline positions={roadPath} pathOptions={{ color: '#06b6d4', weight: 12, opacity: 0.5, className: 'animate-pulse' }} />
                        <Polyline positions={roadPath} pathOptions={{ color: '#ffffff', weight: 3, opacity: 0.9 }} />
                        <Polyline positions={roadPath} pathOptions={{ color: '#06b6d4', weight: 2, dashArray: '10, 15', opacity: 1 }} />
                    </MapContainer>
                </div>

                {/* Overlays d'effets lumineux (Heatmaps et Radar) par-dessus la map Leaflet */}
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    {/* Heatmaps diffuses collées au relief */}
                    <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[30%] right-[20%] w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[150px]"></div>
                    
                    {/* Le Pin de Localisation central et le Scanner Radar */}
                    <div className="absolute flex items-center justify-center">
                        <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-transparent via-transparent to-blue-400/20 animate-radar rounded-full"></div>
                        <div className="absolute w-[500px] h-[500px] border-[2px] border-blue-500/20 rounded-full"></div>
                        <div className="absolute w-[250px] h-[250px] border-[2px] border-blue-500/40 rounded-full"></div>
                        
                        {/* Pin Jaune */}
                        <div className="relative w-10 h-10 bg-yellow-400 rounded-full animate-pulse-neon shadow-[0_0_50px_10px_rgba(234,179,8,0.8)] flex items-center justify-center border-4 border-[#0b1120]">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Reflet global sur la vitre de la tablette */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
        </div>
        
        {/* Vignettage pour fondre les bords de la tablette dans l'obscurité */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.7)_75%,rgba(2,6,23,0.9)_100%)]"></div>
      </div>

      {/* --- FORMULAIRE FLOATING GLASS (Panneau Droit) --- */}
      <div className="absolute right-0 top-0 h-full w-full lg:w-[45%] flex items-center justify-center lg:justify-end lg:pr-12 z-30 pointer-events-none">
        
        {/* La Carte Flottante (Glassmorphism) */}
        <div className="w-full max-w-[480px] bg-white/90 backdrop-blur-[24px] rounded-[2.5rem] p-12 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden pointer-events-auto border border-white/50">
            
            {/* Inner Glow Cyan sur tout le contour intérieur */}
            <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_60px_rgba(6,182,212,0.4)] pointer-events-none border border-cyan-400/20"></div>
            
            {/* Contenu du formulaire */}
            <div className="relative z-10 animate-fade-in-up">
                {children}
            </div>
        </div>

      </div>

    </div>
  );
};

export default AuthLayout;
