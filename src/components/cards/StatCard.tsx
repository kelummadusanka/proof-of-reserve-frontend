import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  isActive: boolean;
  onClick: () => void;
  delay: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  gradient,
  isActive,
  onClick,
  delay
}) => {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-6 border ${
        isActive ? 'border-purple-500/50 shadow-xl' : 'border-white/10'
      } hover:border-purple-500/50 transition-all backdrop-blur-xl animate-[fade-in_0.5s_ease-out_forwards] opacity-0 group cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform ${
          isActive ? 'scale-110' : ''
        }`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs text-gray-400 uppercase font-bold">
          {label}
        </span>
      </div>
      <p className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
        {value}
      </p>
    </button>
  );
};
export default StatCard;
