import type { ItemVisual } from '../itemVisualRegistry';

interface Props { visual: ItemVisual | null }

export default function BottomLayer({ visual }: Props) {
  if (!visual) return null;

  const isLegging = visual.label.toLowerCase().includes('legging') || visual.label.toLowerCase().includes('calça');
  const isShorts = visual.label.toLowerCase().includes('shorts') || visual.label.toLowerCase().includes('bermuda');

  // Shorts cut higher, legging goes all the way down
  const leftEnd = isLegging ? '215' : isShorts ? '195' : '210';
  const rightEnd = isLegging ? '215' : isShorts ? '195' : '210';

  return (
    <g>
      {/* Left leg covering */}
      <path
        d={`M 72 160 L 68 ${leftEnd} L 84 ${leftEnd} L 88 160 Z`}
        fill={visual.primary}
        opacity="0.9"
      />
      {/* Right leg covering */}
      <path
        d={`M 112 160 L 118 ${rightEnd} L 132 ${rightEnd} L 128 160 Z`}
        fill={visual.primary}
        opacity="0.9"
      />

      {/* Waistband */}
      <rect x="68" y="158" width="64" height="5" rx="2" fill={visual.secondary} opacity="0.7" />

      {/* Seam lines */}
      <line x1="78" y1="163" x2="76" y2={leftEnd} stroke={visual.secondary} strokeWidth="0.5" opacity="0.4" />
      <line x1="122" y1="163" x2="125" y2={rightEnd} stroke={visual.secondary} strokeWidth="0.5" opacity="0.4" />
    </g>
  );
}
