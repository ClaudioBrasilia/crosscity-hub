import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function ShoesLayer({ visual }: Props) {
  if (!visual) return null;

  const isBoot = visual.label.toLowerCase().includes('bota');

  return (
    <g>
      {/* Left shoe */}
      <path
        d={isBoot
          ? "M 58 210 L 60 228 L 86 228 Q 90 228 88 222 L 62 222 L 58 210 Z"
          : "M 58 218 Q 56 226 64 228 L 86 228 Q 90 228 88 222 L 62 222 Z"
        }
        fill={visual.primary}
        stroke={visual.secondary}
        strokeWidth="0.8"
        opacity="0.95"
      />
      {/* Left sole */}
      <path d="M 60 228 L 86 228" stroke={visual.accent ?? visual.secondary} strokeWidth="2.5" strokeLinecap="round" />

      {/* Right shoe */}
      <path
        d={isBoot
          ? "M 142 210 L 140 222 L 114 222 Q 112 228 118 228 L 140 228 Q 144 226 142 210 Z"
          : "M 114 222 Q 112 228 118 228 L 140 228 Q 144 226 142 218 L 138 222 Z"
        }
        fill={visual.primary}
        stroke={visual.secondary}
        strokeWidth="0.8"
        opacity="0.95"
      />
      {/* Right sole */}
      <path d="M 118 228 L 140 228" stroke={visual.accent ?? visual.secondary} strokeWidth="2.5" strokeLinecap="round" />

      {/* Lace detail on regular shoes */}
      {!isBoot && (
        <>
          <circle cx="72" cy="221" r="1" fill={visual.accent ?? '#fff'} opacity="0.6" />
          <circle cx="128" cy="221" r="1" fill={visual.accent ?? '#fff'} opacity="0.6" />
        </>
      )}
    </g>
  );
}
