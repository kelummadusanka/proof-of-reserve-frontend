import React, { useState, useEffect } from 'react';
import { ApiPromise } from '@polkadot/api';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, ShieldQuestion } from 'lucide-react';
import { getReputationScore } from '../../services/reputation.service';
import { UIReputationScore } from '../../types';

interface TrustBadgeProps {
  api: ApiPromise | null;
  address: string;
  showScore?: boolean;
  className?: string;
}

const TRUST_CONFIG: Record<UIReputationScore['trustLevel'], {
  label: string;
  Icon: React.ElementType;
  colors: string;
}> = {
  excellent: { label: 'Excellent', Icon: ShieldCheck, colors: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  good:      { label: 'Trusted',   Icon: ShieldCheck, colors: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  neutral:   { label: 'Neutral',   Icon: Shield,      colors: 'bg-gray-400/20 text-gray-300 border-gray-400/40' },
  risky:     { label: 'Risky',     Icon: ShieldAlert, colors: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  unproven:  { label: 'Unproven',  Icon: ShieldX,     colors: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
};

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  api,
  address,
  showScore = true,
  className = '',
}) => {
  const [reputation, setReputation] = useState<UIReputationScore | null | undefined>(undefined);

  useEffect(() => {
    if (!api || !address) return;
    let cancelled = false;
    getReputationScore(api, address).then((r) => {
      if (!cancelled) setReputation(r);
    });
    return () => { cancelled = true; };
  }, [api, address]);

  if (reputation === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-700/40 text-gray-500 border border-slate-600/30 animate-pulse ${className}`}>
        <Shield className="w-3 h-3" />
        <span>Loading...</span>
      </span>
    );
  }

  if (reputation === null) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-700/40 text-gray-500 border border-slate-600/30 ${className}`}>
        <ShieldQuestion className="w-3 h-3" />
        <span>No History</span>
      </span>
    );
  }

  const { label, Icon, colors } = TRUST_CONFIG[reputation.trustLevel];
  const displayScore = Math.round(reputation.overallScore / 100);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-semibold ${colors} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {showScore && (
        <span className="font-mono opacity-80">{displayScore}/100</span>
      )}
    </span>
  );
};

export default TrustBadge;
