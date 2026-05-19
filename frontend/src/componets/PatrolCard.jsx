import React from 'react';
import { MapPin, Calendar, Clock, ArrowRight, FileCheck, CheckCircle2 } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

const statusConfig = {
  en_attente: {
    label: "En Attente",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  nouvelle_mission: {
    label: "Nouvelle Mission",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500 animate-pulse-subtle",
  },
  en_cours: {
    label: "En Cours",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  completee: {
    label: "Complétée",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  en_retard: {
    label: "En Retard",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400 animate-pulse",
  },
};

export function PatrolCard({ location, city, dateLimite, dateRecu, status, progress = 0, onAction, onViewReport, labelDate1 = "Date Limite", labelDate2 = "Reçu le", actionLabel, theme = "patrol" }) {
  const config = statusConfig[status] || statusConfig.en_attente;

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 transition-all duration-500 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5 overflow-hidden">
      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500",
        status === "en_attente" && "from-amber-400 to-orange-500",
        status === "nouvelle_mission" && "from-amber-400 to-orange-500",
        status === "en_cours" && "from-blue-400 to-indigo-500",
        status === "completee" && "from-emerald-400 to-teal-500",
        status === "en_retard" && "from-red-400 to-rose-500",
      )} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
            <MapPin className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm truncate max-w-[150px]">{location}</h4>
            <p className="text-xs text-slate-400 truncate max-w-[150px]">{city}</p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shrink-0", config.bg, config.color, config.border)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
          {config.label}
        </span>
      </div>

      {/* Dates */}
      {status === "completee" ? (
        <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Réalisée le</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{dateLimite}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{labelDate1}</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{dateLimite}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{labelDate2}</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{dateRecu}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && theme !== 'mission' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Progression</span>
            <span className={cn("text-sm font-black", theme === 'mission' ? 'text-orange-600' : 'text-violet-600')}>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", theme === 'mission' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="flex flex-col gap-2">
        {theme === 'mission' && onViewReport && (
          <button onClick={onViewReport} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100 border border-slate-200 transition-all duration-300">
            <FileCheck className="w-4 h-4 text-slate-500" />
            Consulter Rapport Expert
          </button>
        )}
        {(status === "en_attente" || status === "nouvelle_mission") && (
          <button onClick={onAction} className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98]", theme === 'mission' ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/40' : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/25 hover:shadow-violet-500/40')}>
            {actionLabel || "Démarrer"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
        {status === "en_cours" && (
          <button onClick={onAction} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25 hover:shadow-blue-500/40">
            {actionLabel || "Continuer"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {status === "completee" && (
          <button onClick={onAction} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-200 transition-all duration-300">
            {actionLabel || "Voir le rapport"}
          </button>
        )}
        {status === "en_retard" && (
          <button onClick={onAction} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-pulse-subtle">
            Action Urgente
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
