import React from 'react';
import { Check, X, MapPin, Clock } from 'lucide-react';

const AgentRow = ({ agent, onApprove, onReject }) => {
  const initials = `${agent.firstName?.charAt(0) || ''}${agent.name?.charAt(0) || ''}`.toUpperCase();

  return (
    <tr className="group hover:bg-violet-50/40 transition-colors duration-200">
      {/* Identity */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-500/20 flex-shrink-0">
            {initials || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{agent.firstName} {agent.name}</p>
            <p className="text-xs text-slate-400">{agent.email}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <Clock className="w-3 h-3" />
          En attente
        </span>
      </td>

      {/* City */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-300" />
          <span className="italic text-slate-400 text-xs">Auto-assignée</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onApprove(agent._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-200 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            Approuver
          </button>
          <button
            onClick={() => onReject(agent._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-500/25 transition-all duration-200 active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            Rejeter
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AgentRow;
