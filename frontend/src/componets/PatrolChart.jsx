import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function PatrolChart({ orders = [] }) {
  const chartData = React.useMemo(() => {
    const monthsNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const currentMonth = new Date().getMonth();
    const result = [];
    
    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      let d = new Date();
      d.setMonth(currentMonth - i);
      result.push({ 
        month: monthsNames[d.getMonth()], 
        completees: 0, 
        enAttente: 0,
        mIdx: d.getMonth(),
        y: d.getFullYear()
      });
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.dueDate);
      const bucket = result.find(b => b.mIdx === orderDate.getMonth() && b.y === orderDate.getFullYear());
      if (bucket) {
        if (order.status === 'done') {
          bucket.completees += 1;
        } else {
          bucket.enAttente += 1;
        }
      }
    });

    return result;
  }, [orders]);
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Analyse des Patrouilles</h3>
          <p className="text-sm text-slate-500 mt-0.5">Évolution mensuelle des patrouilles</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
            <span className="text-xs text-slate-500">Complétées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
            <span className="text-xs text-slate-500">En attente</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompletees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEnAttente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
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
          <Area
            type="monotone"
            dataKey="completees"
            stroke="#7C3AED"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCompletees)"
            name="Complétées"
          />
          <Area
            type="monotone"
            dataKey="enAttente"
            stroke="#F59E0B"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorEnAttente)"
            name="En attente"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
