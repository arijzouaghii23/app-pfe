import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MissionChart({ missions = [] }) {
  const chartData = React.useMemo(() => {
    const counts = {};
    missions.forEach(m => {
      let cat = m.aiResult?.yoloClassName || 'Autre';
      if (!cat || cat === 'null') cat = 'Autre';
      // Mappage de quelques classes YOLO courantes vers des termes métier si besoin
      if (cat.toLowerCase().includes('pothole') || cat.toLowerCase().includes('crack')) cat = 'Chaussée';
      if (cat.toLowerCase().includes('sign')) cat = 'Signalisation';
      
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const dataArray = Object.keys(counts).map(key => ({
      category: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key]
    })).sort((a, b) => b.count - a.count);

    return dataArray.length > 0 ? dataArray.slice(0, 6) : [
      { category: 'Signalisation', count: 0 },
      { category: 'Chaussée', count: 0 },
      { category: 'Éclairage', count: 0 },
      { category: 'Marquage', count: 0 }
    ];
  }, [missions]);
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Répartition des Missions</h3>
          <p className="text-sm text-slate-500 mt-0.5">Analyse des catégories d'intervention</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViolet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={1} />
              <stop offset="95%" stopColor="#C026D3" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Bar
            dataKey="count"
            fill="url(#colorViolet)"
            radius={[10, 10, 0, 0]}
            barSize={40}
            name="Nombre"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
