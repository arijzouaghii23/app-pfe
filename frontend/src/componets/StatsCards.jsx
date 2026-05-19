import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, BarChart3 } from "lucide-react";

export function StatsCards({ total = 0, completed = 0, pending = 0, inProgress = 0, late = 0, type = "patrol" }) {
  const isMission = type === "mission";
  
  const stats = [
    {
      label: isMission ? "Total Missions" : "Total Patrouilles",
      value: total.toString(),
      change: "Ce mois",
      icon: BarChart3,
      gradient: "from-violet-500 to-indigo-600",
      shadow: "shadow-violet-500/25",
      bgLight: "bg-violet-50",
    },
    {
      label: "Complétées",
      value: completed.toString(),
      change: `${Math.round((completed/total)*100 || 0)}% du total`,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/25",
      bgLight: "bg-emerald-50",
    },
    {
      label: isMission ? "Nouvelles Missions" : "En Cours",
      value: inProgress.toString(),
      change: "Sur le terrain",
      icon: Clock,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/25",
      bgLight: "bg-blue-50",
    }
  ];

  if (!isMission) {
    stats.push(
      {
        label: "En Attente",
        value: pending.toString(),
        change: "À traiter",
        icon: Clock,
        gradient: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/25",
        bgLight: "bg-amber-50",
      },
      {
        label: "En Retard",
        value: late.toString(),
        change: "Action requise",
        icon: AlertTriangle,
        gradient: "from-red-500 to-rose-600",
        shadow: "shadow-red-500/25",
        bgLight: "bg-red-50",
      }
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMission ? 'lg:grid-cols-3' : 'lg:grid-cols-5'} gap-5`}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="group relative bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Decorative bottom bar */}
          <div className={`absolute bottom-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        </div>
      ))}
    </div>
  );
}
