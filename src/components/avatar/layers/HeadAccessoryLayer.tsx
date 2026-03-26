import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function HeadAccessoryLayer({ visual }: Props) {
  if (!visual) return null;

  const isCrown = visual.label.toLowerCase().includes('coroa') || visual.label.toLowerCase().includes('tiara');
  const isCap = visual.label.toLowerCase().includes('boné');

  if (isCrown) {
    return (
      <g>
        <path
          d="M 72 36 L 80 18 L 90 30 L 100 12 L 110 30 L 120 18 L 128 36"
          fill={visual.primary}
          opacity="0.9"
        />
        <path d="M 72 36 L 128 36" stroke={visual.secondary} strokeWidth="3" strokeLinecap="round" />
        {/* Gem on crown */}
        {visual.accent && <circle cx="100" cy="22" r="3" fill={visual.accent} opacity="0.9" />}
      </g>
    );
  }

  if (isCap) {
    return (
      <g>
        {/* Cap dome */}
        <path
          d="M 70 45 Q 70 20 100 20 Q 130 20 130 45"
          fill={visual.primary}
          opacity="0.9"
        />
        {/* Brim */}
        <path
          d="M 65 45 L 105 42 L 100 48 L 65 48 Z"
          fill={visual.secondary}
          opacity="0.85"
        />
      </g>
    );
  }

  // Default: headband
  return (
    <g>
      <rect x="70" y="34" width="60" height="6" rx="3" fill={visual.primary} opacity="0.9" />
      <rect x="70" y="36" width="60" height="2" rx="1" fill={visual.secondary} opacity="0.4" />
    </g>
  );
}
