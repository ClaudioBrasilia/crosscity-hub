import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function AccessoryLayer({ visual }: Props) {
  if (!visual) return null;

  const isBelt = visual.label.toLowerCase().includes('cinto') || visual.label.toLowerCase().includes('faixa');

  if (isBelt) {
    return (
      <g>
        <rect x="68" y="152" width="64" height="5" rx="2" fill={visual.primary} opacity="0.9" />
        {/* Buckle */}
        <rect x="95" y="151" width="10" height="7" rx="1.5" fill={visual.secondary} stroke={visual.primary} strokeWidth="0.5" opacity="0.9" />
      </g>
    );
  }

  // Necklace / pendant
  return (
    <g>
      <path
        d="M 85 86 Q 100 100 115 86"
        fill="none"
        stroke={visual.primary}
        strokeWidth="1.5"
        opacity="0.85"
      />
      <circle cx="100" cy="98" r="4" fill={visual.secondary} stroke={visual.primary} strokeWidth="1" opacity="0.9" />
    </g>
  );
}
