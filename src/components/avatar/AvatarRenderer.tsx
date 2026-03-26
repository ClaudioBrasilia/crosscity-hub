interface AvatarRendererProps {
  equipped_top?: string | null;
  equipped_bottom?: string | null;
  equipped_shoes?: string | null;
  equipped_accessory?: string | null;
  equipped_head_accessory?: string | null;
  equipped_wrist_accessory?: string | null;
  equipped_special?: string | null;
  className?: string;
}

const detectVariant = (value: string | null | undefined, variants: Record<string, string>, fallback: string): string => {
  const normalized = (value || '').toLowerCase();
  for (const key of Object.keys(variants)) {
    if (normalized.includes(key)) return variants[key];
  }
  return fallback;
};

const getTopVariant = (value: string | null | undefined) =>
  detectVariant(value, { regata: 'tank', tank: 'tank', hoodie: 'hoodie', moletom: 'hoodie' }, 'tee');

const getBottomVariant = (value: string | null | undefined) =>
  detectVariant(value, { legging: 'legging', tights: 'legging', calca: 'legging' }, 'shorts');

const getShoesVariant = (value: string | null | undefined) =>
  detectVariant(value, { high: 'high', cano: 'high' }, 'trainer');

const getAccessoryVariant = (value: string | null | undefined) =>
  detectVariant(value, { medal: 'medal', cord: 'cord', strap: 'strap' }, 'none');

const getHeadAccessoryVariant = (value: string | null | undefined) =>
  detectVariant(value, { cap: 'cap', bone: 'cap', headband: 'headband', faixa: 'headband' }, 'none');

const getWristAccessoryVariant = (value: string | null | undefined) =>
  detectVariant(value, { watch: 'watch', relogio: 'watch', wrap: 'wrap', munhequeira: 'wrap' }, 'none');

const getSpecialVariant = (value: string | null | undefined) =>
  detectVariant(value, { fire: 'fire', flame: 'fire', energia: 'energy', glow: 'energy' }, 'none');

const AvatarRenderer = ({
  equipped_top,
  equipped_bottom,
  equipped_shoes,
  equipped_accessory,
  equipped_head_accessory,
  equipped_wrist_accessory,
  equipped_special,
  className,
}: AvatarRendererProps) => {
  const top = getTopVariant(equipped_top);
  const bottom = getBottomVariant(equipped_bottom);
  const shoes = getShoesVariant(equipped_shoes);
  const accessory = getAccessoryVariant(equipped_accessory);
  const headAccessory = getHeadAccessoryVariant(equipped_head_accessory);
  const wristAccessory = getWristAccessoryVariant(equipped_wrist_accessory);
  const special = getSpecialVariant(equipped_special);

  return (
    <div className={className}>
      <svg viewBox="0 0 220 360" className="w-full h-auto" role="img" aria-label="Avatar 2.5D">
        <defs>
          <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f1c8a6" />
            <stop offset="100%" stopColor="#d79d73" />
          </linearGradient>
          <linearGradient id="shirt" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#5ea9ff" />
            <stop offset="100%" stopColor="#2f6cd6" />
          </linearGradient>
          <linearGradient id="shorts" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f3545" />
            <stop offset="100%" stopColor="#1b1f2a" />
          </linearGradient>
          <linearGradient id="shoe" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f2f4f8" />
            <stop offset="100%" stopColor="#c8d0dc" />
          </linearGradient>
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(12,16,23,0.28)" />
            <stop offset="100%" stopColor="rgba(12,16,23,0)" />
          </radialGradient>
        </defs>

        {special === 'energy' && <ellipse cx="110" cy="182" rx="84" ry="138" fill="rgba(93, 219, 255, 0.16)" />}
        {special === 'fire' && <ellipse cx="110" cy="190" rx="86" ry="142" fill="rgba(255, 137, 66, 0.18)" />}

        <ellipse cx="110" cy="335" rx="52" ry="13" fill="url(#shadow)" />

        {/* Base body layer */}
        <circle cx="110" cy="58" r="30" fill="url(#skin)" />
        <path d="M83 90C83 73 97 64 110 64C123 64 137 73 137 90V116H83V90Z" fill="url(#skin)" />
        <rect x="66" y="102" width="20" height="76" rx="10" fill="url(#skin)" />
        <rect x="134" y="102" width="20" height="76" rx="10" fill="url(#skin)" />
        <rect x="90" y="218" width="16" height="88" rx="8" fill="url(#skin)" />
        <rect x="114" y="218" width="16" height="88" rx="8" fill="url(#skin)" />
        <circle cx="76" cy="185" r="9" fill="url(#skin)" />
        <circle cx="144" cy="185" r="9" fill="url(#skin)" />

        {/* Top layer */}
        {top === 'tee' && (
          <path d="M70 106L84 96H136L150 106V192H70V106Z" fill="url(#shirt)" />
        )}
        {top === 'tank' && (
          <path d="M82 102C86 94 93 90 100 90H120C127 90 134 94 138 102L144 190H76L82 102Z" fill="url(#shirt)" />
        )}
        {top === 'hoodie' && (
          <>
            <path d="M68 106L84 94H136L152 106V194H68V106Z" fill="#32426a" />
            <path d="M92 94C95 82 103 76 110 76C117 76 125 82 128 94Z" fill="#41558a" />
          </>
        )}

        {/* Bottom layer */}
        {bottom === 'shorts' && <path d="M78 188H142L136 240H84L78 188Z" fill="url(#shorts)" />}
        {bottom === 'legging' && (
          <>
            <path d="M78 188H142L138 312H124L120 238H100L96 312H82L78 188Z" fill="#1d2538" />
            <path d="M92 188H128V208H92Z" fill="#33405e" opacity="0.6" />
          </>
        )}

        {/* Shoes layer */}
        {shoes === 'trainer' && (
          <>
            <path d="M80 306H110C116 306 120 311 120 317V321H80V306Z" fill="url(#shoe)" />
            <path d="M100 306H130C136 306 140 311 140 317V321H100V306Z" fill="url(#shoe)" />
          </>
        )}
        {shoes === 'high' && (
          <>
            <path d="M80 294H110C116 294 120 299 120 305V321H80V294Z" fill="#d7e0eb" />
            <path d="M100 294H130C136 294 140 299 140 305V321H100V294Z" fill="#d7e0eb" />
          </>
        )}

        {/* Accessory layer */}
        {accessory === 'strap' && <path d="M92 112L102 192H112L122 112H116L108 172L100 112Z" fill="#171d2a" opacity="0.75" />}
        {accessory === 'cord' && <path d="M94 110C96 138 98 156 110 182C122 156 124 138 126 110" stroke="#f2f5ff" strokeWidth="3" fill="none" opacity="0.85" />}
        {accessory === 'medal' && (
          <>
            <path d="M98 110L110 152L122 110" stroke="#f8fbff" strokeWidth="3" fill="none" />
            <circle cx="110" cy="165" r="10" fill="#e8b84d" />
          </>
        )}

        {/* Head accessory layer */}
        {headAccessory === 'headband' && <rect x="82" y="46" width="56" height="9" rx="4.5" fill="#f35a5a" />}
        {headAccessory === 'cap' && (
          <>
            <path d="M82 56C82 42 94 34 110 34C126 34 138 42 138 56V61H82V56Z" fill="#27324f" />
            <ellipse cx="110" cy="61" rx="34" ry="6" fill="#1e2942" />
          </>
        )}

        {/* Wrist accessory layer */}
        {wristAccessory === 'wrap' && (
          <>
            <rect x="66" y="160" width="20" height="9" rx="4" fill="#f4f7fb" />
            <rect x="134" y="160" width="20" height="9" rx="4" fill="#f4f7fb" />
          </>
        )}
        {wristAccessory === 'watch' && (
          <>
            <rect x="66" y="160" width="20" height="9" rx="4" fill="#222e4a" />
            <circle cx="76" cy="164.5" r="3.8" fill="#dce7f7" />
          </>
        )}

        {/* Special layer */}
        {special === 'fire' && (
          <path d="M164 124C172 136 170 149 162 158C158 148 151 146 149 136C147 126 154 118 157 114C159 118 162 121 164 124Z" fill="#ff8d49" />
        )}
        {special === 'energy' && (
          <path d="M158 116L168 136L154 136L166 160L146 132H158L148 116H158Z" fill="#7ee8ff" />
        )}
      </svg>
    </div>
  );
};

export default AvatarRenderer;
