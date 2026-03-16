import React from 'react';
import { Boxes, TrendingUp, Zap, Sparkles, Check } from 'lucide-react';
import StatCard from '../cards/StatCard';

interface StatsSectionProps {
  stats: Array<{
    label: string;
    value: number;
    icon: any;
    gradient: string;
    mode: 'all' | 'myOffers' | 'myListings' | 'completed';
  }>;
  viewMode: 'all' | 'myOffers' | 'myListings' | 'completed';
  onViewModeChange: (mode: 'all' | 'myOffers' | 'myListings' | 'completed') => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          gradient={stat.gradient}
          isActive={viewMode === stat.mode}
          onClick={() => onViewModeChange(stat.mode)}
          delay={index * 100}
        />
      ))}
    </div>
  );
};

export default StatsSection;
