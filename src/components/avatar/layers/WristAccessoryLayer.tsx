import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function WristAccessoryLayer({ visual }: Props) {
  if (!visual) return null;

  const isWatch = visual.label.toLowerCase().includes('relógio') || visual.label.toLowerCase().includes('relogio');

  return (
    <g>
      {/* Left wrist */}
      <rect x="40" y="142" width="16" height="8" rx="3" fill={visual.primary} opacity="0.9" />
      {/* Right wrist */}
      <rect x="144" y="142" width="16" height="8" rx="3" fill={visual.primary} opacity="0.9" />

      {isWatch && (
        <>
          {/* Watch face on left wrist */}
          <rect x="44" y="143" width="6" height="6" rx="1" fill={visual.accent ?? '#fff'} opacity="0.8" />
          <circle cx="47" cy="146" r="1.5" fill={visual.secondary} opacity="0.7" />
        </>
      )}
    </g>
  );
}
