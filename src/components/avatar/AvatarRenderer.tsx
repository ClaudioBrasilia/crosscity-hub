import { useMemo } from 'react';

export interface AvatarEquipment {
  base_outfit: string | null;
  equipped_top: string | null;
  equipped_bottom: string | null;
  equipped_shoes: string | null;
  equipped_accessory: string | null;
  equipped_head_accessory: string | null;
  equipped_wrist_accessory: string | null;
  equipped_special: string | null;
}

const SLOT_COLORS: Record<string, { equipped: string; base: string }> = {
  base_outfit:              { equipped: '#3b82f6', base: '#64748b' },
  equipped_top:             { equipped: '#8b5cf6', base: '#475569' },
  equipped_bottom:          { equipped: '#06b6d4', base: '#475569' },
  equipped_shoes:           { equipped: '#f59e0b', base: '#475569' },
  equipped_accessory:       { equipped: '#ec4899', base: 'none'    },
  equipped_head_accessory:  { equipped: '#ef4444', base: 'none'    },
  equipped_wrist_accessory: { equipped: '#10b981', base: 'none'    },
  equipped_special:         { equipped: '#f97316', base: 'none'    },
};

interface Props {
  equipment: AvatarEquipment;
  size?: number;
}

export default function AvatarRenderer({ equipment, size = 280 }: Props) {
  const eq = useMemo(() => ({
    hasTop:   !!equipment.equipped_top,
    hasBottom:!!equipment.equipped_bottom,
    hasShoes: !!equipment.equipped_shoes,
    hasHead:  !!equipment.equipped_head_accessory,
    hasWrist: !!equipment.equipped_wrist_accessory,
    hasAcc:   !!equipment.equipped_accessory,
    hasSpecial:!!equipment.equipped_special,
    outfit:   equipment.base_outfit ?? 'basic',
  }), [equipment]);

  const c = (slot: keyof typeof SLOT_COLORS, isEquipped: boolean) =>
    isEquipped ? SLOT_COLORS[slot].equipped : SLOT_COLORS[slot].base;

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
        {/* === SPECIAL AURA === */}
        {eq.hasSpecial && (
          <g>
            <circle cx="100" cy="80" r="72" fill="none" stroke={c('equipped_special', true)} strokeWidth="2" opacity="0.3">
              <animate attributeName="r" values="70;74;70" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="80" r="66" fill="none" stroke={c('equipped_special', true)} strokeWidth="1" opacity="0.15">
              <animate attributeName="r" values="64;68;64" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* === HEAD === */}
        <circle cx="100" cy="52" r="32" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Face */}
        <circle cx="88" cy="48" r="3" fill="#94a3b8" /> {/* left eye */}
        <circle cx="112" cy="48" r="3" fill="#94a3b8" /> {/* right eye */}
        <path d="M 93 60 Q 100 66 107 60" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" /> {/* smile */}

        {/* === HEAD ACCESSORY === */}
        {eq.hasHead && (
          <g>
            {/* Crown / headband */}
            <path
              d="M 72 36 L 80 18 L 90 30 L 100 12 L 110 30 L 120 18 L 128 36"
              fill={c('equipped_head_accessory', true)}
              opacity="0.9"
            />
            <path
              d="M 72 36 L 128 36"
              stroke={c('equipped_head_accessory', true)}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* === NECK === */}
        <rect x="93" y="82" width="14" height="10" rx="2" fill="#1e293b" />

        {/* === TORSO (base) === */}
        <path
          d="M 65 92 Q 65 88 72 88 L 128 88 Q 135 88 135 92 L 140 155 Q 140 160 135 160 L 65 160 Q 60 160 60 155 Z"
          fill={c('base_outfit', true)}
          stroke="#334155"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* === TOP OVERLAY === */}
        {eq.hasTop && (
          <path
            d="M 65 92 Q 65 88 72 88 L 128 88 Q 135 88 135 92 L 138 130 L 62 130 Z"
            fill={c('equipped_top', true)}
            opacity="0.85"
          />
        )}

        {/* === ARMS === */}
        {/* Left arm */}
        <path
          d="M 65 94 L 45 130 L 42 148 Q 40 153 45 153 L 52 150 L 58 135 L 65 110"
          fill="#1e293b"
          stroke={eq.hasTop ? c('equipped_top', true) : '#334155'}
          strokeWidth="1.5"
        />
        {/* Right arm */}
        <path
          d="M 135 94 L 155 130 L 158 148 Q 160 153 155 153 L 148 150 L 142 135 L 135 110"
          fill="#1e293b"
          stroke={eq.hasTop ? c('equipped_top', true) : '#334155'}
          strokeWidth="1.5"
        />

        {/* === WRIST ACCESSORIES === */}
        {eq.hasWrist && (
          <g>
            <rect x="40" y="142" width="16" height="8" rx="3" fill={c('equipped_wrist_accessory', true)} opacity="0.9" />
            <rect x="144" y="142" width="16" height="8" rx="3" fill={c('equipped_wrist_accessory', true)} opacity="0.9" />
          </g>
        )}

        {/* === BOTTOM / LEGS === */}
        {/* Left leg */}
        <path
          d="M 72 160 L 68 215 L 62 218 Q 60 220 64 222 L 82 222 Q 85 222 84 218 L 82 215 L 88 160"
          fill={eq.hasBottom ? c('equipped_bottom', true) : '#1e293b'}
          stroke="#334155"
          strokeWidth="1"
          opacity={eq.hasBottom ? 0.85 : 1}
        />
        {/* Right leg */}
        <path
          d="M 112 160 L 118 215 L 116 218 Q 115 222 118 222 L 138 222 Q 140 222 138 218 L 132 215 L 128 160"
          fill={eq.hasBottom ? c('equipped_bottom', true) : '#1e293b'}
          stroke="#334155"
          strokeWidth="1"
          opacity={eq.hasBottom ? 0.85 : 1}
        />

        {/* === SHOES === */}
        {eq.hasShoes ? (
          <g>
            <path d="M 58 218 Q 56 226 64 228 L 86 228 Q 90 228 88 222 L 62 222 Z" fill={c('equipped_shoes', true)} opacity="0.9" />
            <path d="M 114 222 Q 112 228 118 228 L 140 228 Q 144 226 142 218 L 138 222 Z" fill={c('equipped_shoes', true)} opacity="0.9" />
          </g>
        ) : (
          <g>
            <path d="M 58 218 Q 56 226 64 228 L 86 228 Q 90 228 88 222 L 62 222 Z" fill="#334155" opacity="0.6" />
            <path d="M 114 222 Q 112 228 118 228 L 140 228 Q 144 226 142 218 L 138 222 Z" fill="#334155" opacity="0.6" />
          </g>
        )}

        {/* === ACCESSORY (belt/necklace area) === */}
        {eq.hasAcc && (
          <g>
            <rect x="68" y="152" width="64" height="6" rx="3" fill={c('equipped_accessory', true)} opacity="0.85" />
            <circle cx="100" cy="155" r="5" fill={c('equipped_accessory', true)} stroke="#fff" strokeWidth="1" opacity="0.9" />
          </g>
        )}
      </svg>
    </div>
  );
}
