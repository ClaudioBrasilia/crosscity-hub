import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function SpecialLayer({ visual }: Props) {
  if (!visual) return null;

  const gradientId = 'special-aura-grad';

  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={visual.primary} stopOpacity="0.3" />
          <stop offset="60%" stopColor={visual.secondary} stopOpacity="0.15" />
          <stop offset="100%" stopColor={visual.accent ?? visual.secondary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer aura glow */}
      <ellipse cx="100" cy="130" rx="80" ry="110" fill={`url(#${gradientId})`}>
        <animate attributeName="rx" values="78;82;78" dur="3s" repeatCount="indefinite" />
        <animate attributeName="ry" values="108;112;108" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Inner ring */}
      <circle cx="100" cy="80" r="68" fill="none" stroke={visual.primary} strokeWidth="1.5" opacity="0.25">
        <animate attributeName="r" values="66;70;66" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Sparkle particles */}
      {[30, 90, 150, 210, 270, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.cos(rad) * 60;
        const cy = 100 + Math.sin(rad) * 60;
        return (
          <circle key={angle} cx={cx} cy={cy} r="1.5" fill={visual.accent ?? visual.primary} opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${2 + (angle % 3) * 0.5}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </g>
  );
}
