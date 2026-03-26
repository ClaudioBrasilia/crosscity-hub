import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function TopLayer({ visual }: Props) {
  if (!visual) return null;

  const isTank = visual.label.toLowerCase().includes('regata') || visual.label.toLowerCase().includes('tank');
  const isHoodie = visual.label.toLowerCase().includes('hoodie');
  const isGradient = visual.pattern === 'gradient';

  const gradientId = 'top-grad';

  return (
    <g>
      {isGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={visual.primary} />
            <stop offset="100%" stopColor={visual.secondary} />
          </linearGradient>
        </defs>
      )}

      {/* Main torso overlay */}
      <path
        d="M 65 92 Q 65 88 72 88 L 128 88 Q 135 88 135 92 L 138 130 L 62 130 Z"
        fill={isGradient ? `url(#${gradientId})` : visual.primary}
        opacity="0.9"
      />

      {/* Collar */}
      <path
        d="M 88 88 Q 100 95 112 88"
        stroke={visual.secondary}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {isTank ? (
        /* Tank/Regata – wider arm holes */
        <>
          <path d="M 65 92 L 72 88" stroke={visual.secondary} strokeWidth="2.5" />
          <path d="M 135 92 L 128 88" stroke={visual.secondary} strokeWidth="2.5" />
        </>
      ) : isHoodie ? (
        /* Hoodie – hood outline behind head */
        <>
          <path
            d="M 75 85 Q 75 40 100 35 Q 125 40 125 85"
            fill="none"
            stroke={visual.secondary}
            strokeWidth="2"
            opacity="0.5"
          />
          <path
            d="M 90 120 L 90 130 L 110 130 L 110 120"
            fill={visual.secondary}
            opacity="0.4"
          />
        </>
      ) : (
        /* Regular t-shirt – sleeve lines */
        <>
          <path d="M 65 92 L 55 105" stroke={visual.secondary} strokeWidth="1.5" opacity="0.6" />
          <path d="M 135 92 L 145 105" stroke={visual.secondary} strokeWidth="1.5" opacity="0.6" />
        </>
      )}

      {/* Seam detail */}
      <line x1="100" y1="92" x2="100" y2="128" stroke={visual.secondary} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}
