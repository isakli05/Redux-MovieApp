import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  gradient?: string;
}

function StatCard({ icon, label, value, gradient = 'from-cyan-500 to-blue-500' }: StatCardProps) {
  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300">
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} p-2.5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <div className="w-full h-full text-white">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-sm font-medium mb-0.5">
            {label}
          </p>
          <p className="text-white text-2xl font-bold truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
