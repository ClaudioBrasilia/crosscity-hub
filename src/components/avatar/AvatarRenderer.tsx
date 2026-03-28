import { useMemo } from 'react';
import { getItemVisual } from './itemVisualRegistry';
import TopLayer from './layers/TopLayer';
import BottomLayer from './layers/BottomLayer';
import ShoesLayer from './layers/ShoesLayer';
import HeadAccessoryLayer from './layers/HeadAccessoryLayer';
import AccessoryLayer from './layers/AccessoryLayer';
import WristAccessoryLayer from './layers/WristAccessoryLayer';
import SpecialLayer from './layers/SpecialLayer';

export interface AvatarEquipment {
  base_outfit: string | null;
  equipped_hair?: string | null;
  equipped_top: string | null;
  equipped_bottom: string | null;
  equipped_shoes: string | null;
  equipped_accessory: string | null;
  equipped_head_accessory: string | null;
  equipped_wrist_accessory: string | null;
  equipped_special: string | null;
}

interface Props {
  equipment: AvatarEquipment;
  size?: number;
  layeredImages?: {
    body: string;
    hair?: string | null;
    top?: string | null;
    bottom?: string | null;
    shoes?: string | null;
    accessory?: string | null;
  };
}

export default function AvatarRenderer({ equipment, size = 280, layeredImages }: Props) {
  const visuals = useMemo(() => ({
    top: getItemVisual('equipped_top', equipment.equipped_top),
    bottom: getItemVisual('equipped_bottom', equipment.equipped_bottom),
    shoes: getItemVisual('equipped_shoes', equipment.equipped_shoes),
    accessory: getItemVisual('equipped_accessory', equipment.equipped_accessory),
    head: getItemVisual('equipped_head_accessory', equipment.equipped_head_accessory),
    wrist: getItemVisual('equipped_wrist_accessory', equipment.equipped_wrist_accessory),
    special: getItemVisual('equipped_special', equipment.equipped_special),
  }), [equipment]);

  if (layeredImages?.body) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20" style={{ width: size, height: size }}>
        <img src={layeredImages.body} alt="Avatar body" className="absolute inset-0 h-full w-full object-cover" />
        {layeredImages.hair && <img src={layeredImages.hair} alt="Avatar hair" className="absolute inset-0 h-full w-full object-cover" />}
        {layeredImages.top && <img src={layeredImages.top} alt="Avatar top" className="absolute inset-0 h-full w-full object-cover" />}
        {layeredImages.bottom && <img src={layeredImages.bottom} alt="Avatar bottom" className="absolute inset-0 h-full w-full object-cover" />}
        {layeredImages.shoes && <img src={layeredImages.shoes} alt="Avatar shoes" className="absolute inset-0 h-full w-full object-cover" />}
        {layeredImages.accessory && <img src={layeredImages.accessory} alt="Avatar accessory" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow ring behind avatar */}
      <div
        className="absolute rounded-full opacity-30 blur-xl"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: `radial-gradient(circle, hsl(217 91% 60% / 0.5), transparent 70%)`,
        }}
      />

      <svg
        viewBox="0 0 200 260"
        width={size}
        height={size * 1.3}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-lg"
      >
        {/* === SPECIAL AURA (behind everything) === */}
        <SpecialLayer visual={visuals.special} />

        {/* === HEAD === */}
        <circle cx="100" cy="52" r="32" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Face */}
        <circle cx="88" cy="48" r="3" fill="#94a3b8" />
        <circle cx="112" cy="48" r="3" fill="#94a3b8" />
        <path d="M 93 60 Q 100 66 107 60" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* === HEAD ACCESSORY === */}
        <HeadAccessoryLayer visual={visuals.head} />

        {/* === NECK === */}
        <rect x="93" y="82" width="14" height="10" rx="2" fill="#1e293b" />

        {/* === TORSO (base) === */}
        <path
          d="M 65 92 Q 65 88 72 88 L 128 88 Q 135 88 135 92 L 140 155 Q 140 160 135 160 L 65 160 Q 60 160 60 155 Z"
          fill={visuals.top ? '#1e293b' : '#3b82f6'}
          stroke="#334155"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* === TOP OVERLAY (real item) === */}
        <TopLayer visual={visuals.top} />

        {/* === ARMS === */}
        <path
          d="M 65 94 L 45 130 L 42 148 Q 40 153 45 153 L 52 150 L 58 135 L 65 110"
          fill="#1e293b"
          stroke={visuals.top ? visuals.top.secondary : '#334155'}
          strokeWidth="1.5"
        />
        <path
          d="M 135 94 L 155 130 L 158 148 Q 160 153 155 153 L 148 150 L 142 135 L 135 110"
          fill="#1e293b"
          stroke={visuals.top ? visuals.top.secondary : '#334155'}
          strokeWidth="1.5"
        />

        {/* === WRIST ACCESSORIES === */}
        <WristAccessoryLayer visual={visuals.wrist} />

        {/* === LEGS (base) === */}
        <path
          d="M 72 160 L 68 215 L 62 218 Q 60 220 64 222 L 82 222 Q 85 222 84 218 L 82 215 L 88 160"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1"
        />
        <path
          d="M 112 160 L 118 215 L 116 218 Q 115 222 118 222 L 138 222 Q 140 222 138 218 L 132 215 L 128 160"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1"
        />

        {/* === BOTTOM OVERLAY (real item) === */}
        <BottomLayer visual={visuals.bottom} />

        {/* === SHOES (real item or default) === */}
        {visuals.shoes ? (
          <ShoesLayer visual={visuals.shoes} />
        ) : (
          <g>
            <path d="M 58 218 Q 56 226 64 228 L 86 228 Q 90 228 88 222 L 62 222 Z" fill="#334155" opacity="0.6" />
            <path d="M 114 222 Q 112 228 118 228 L 140 228 Q 144 226 142 218 L 138 222 Z" fill="#334155" opacity="0.6" />
          </g>
        )}

        {/* === ACCESSORY (belt/necklace - real item) === */}
        <AccessoryLayer visual={visuals.accessory} />
      </svg>
    </div>
  );
}
