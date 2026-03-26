/**
 * Item Visual Registry
 * 
 * Maps item identifiers (the string stored in equipped_* slots) to visual definitions.
 * Each entry defines colors/styles used by the SVG layer components.
 * 
 * HOW TO ADD NEW ITEMS:
 * 1. Add an entry to the relevant VISUALS map below
 * 2. The key must match the string stored in the user_avatars equipped_* column
 * 3. Define colors (primary, secondary, accent) used by the layer component
 * 4. Done — the AvatarRenderer picks it up automatically
 */

export interface ItemVisual {
  label: string;
  primary: string;     // main color
  secondary: string;   // trim/detail color
  accent?: string;     // optional highlight
  pattern?: 'solid' | 'stripe' | 'gradient';
}

const DEFAULT_VISUAL: ItemVisual = {
  label: 'Base',
  primary: '#3b82f6',
  secondary: '#2563eb',
  pattern: 'solid',
};

// ── TOP (camisetas, regatas, tanks) ──
export const TOP_VISUALS: Record<string, ItemVisual> = {
  camiseta_preta:    { label: 'Camiseta Preta',    primary: '#1e1e1e', secondary: '#333333', pattern: 'solid' },
  camiseta_branca:   { label: 'Camiseta Branca',   primary: '#f1f5f9', secondary: '#e2e8f0', pattern: 'solid' },
  regata_vermelha:   { label: 'Regata Vermelha',    primary: '#dc2626', secondary: '#b91c1c', pattern: 'solid' },
  regata_azul:       { label: 'Regata Azul',        primary: '#2563eb', secondary: '#1d4ed8', pattern: 'solid' },
  tank_verde:        { label: 'Tank Verde',         primary: '#16a34a', secondary: '#15803d', pattern: 'solid' },
  hoodie_cinza:      { label: 'Hoodie Cinza',       primary: '#6b7280', secondary: '#4b5563', pattern: 'solid' },
  camiseta_gradiente:{ label: 'Camiseta Gradiente', primary: '#8b5cf6', secondary: '#ec4899', pattern: 'gradient' },
};

// ── BOTTOM (shorts, leggings, calças) ──
export const BOTTOM_VISUALS: Record<string, ItemVisual> = {
  shorts_preto:      { label: 'Shorts Preto',      primary: '#1e1e1e', secondary: '#333333', pattern: 'solid' },
  shorts_azul:       { label: 'Shorts Azul',        primary: '#1e40af', secondary: '#1e3a8a', pattern: 'solid' },
  legging_preta:     { label: 'Legging Preta',      primary: '#0f0f0f', secondary: '#262626', pattern: 'solid' },
  bermuda_cinza:     { label: 'Bermuda Cinza',       primary: '#6b7280', secondary: '#4b5563', pattern: 'solid' },
  calca_verde:       { label: 'Calça Verde',         primary: '#166534', secondary: '#14532d', pattern: 'solid' },
};

// ── SHOES (tênis, botas) ──
export const SHOES_VISUALS: Record<string, ItemVisual> = {
  tenis_branco:      { label: 'Tênis Branco',       primary: '#f8fafc', secondary: '#e2e8f0', accent: '#3b82f6', pattern: 'solid' },
  tenis_preto:       { label: 'Tênis Preto',        primary: '#1e1e1e', secondary: '#333333', accent: '#ef4444', pattern: 'solid' },
  tenis_vermelho:    { label: 'Tênis Vermelho',      primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24', pattern: 'solid' },
  bota_marrom:       { label: 'Bota Marrom',         primary: '#78350f', secondary: '#92400e', pattern: 'solid' },
};

// ── ACCESSORY (cintos, colares) ──
export const ACCESSORY_VISUALS: Record<string, ItemVisual> = {
  cinto_dourado:     { label: 'Cinto Dourado',      primary: '#f59e0b', secondary: '#d97706', pattern: 'solid' },
  colar_prata:       { label: 'Colar Prata',        primary: '#94a3b8', secondary: '#cbd5e1', pattern: 'solid' },
  faixa_preta:       { label: 'Faixa Preta',        primary: '#171717', secondary: '#262626', pattern: 'solid' },
};

// ── HEAD ACCESSORY (coroas, bonés, headbands) ──
export const HEAD_VISUALS: Record<string, ItemVisual> = {
  coroa_ouro:        { label: 'Coroa de Ouro',      primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', pattern: 'solid' },
  bone_preto:        { label: 'Boné Preto',         primary: '#1e1e1e', secondary: '#333333', pattern: 'solid' },
  headband_vermelho: { label: 'Headband Vermelho',   primary: '#dc2626', secondary: '#b91c1c', pattern: 'solid' },
  tiara_diamante:    { label: 'Tiara Diamante',      primary: '#a5f3fc', secondary: '#67e8f9', accent: '#ffffff', pattern: 'gradient' },
};

// ── WRIST ACCESSORY (munhequeiras, relógios) ──
export const WRIST_VISUALS: Record<string, ItemVisual> = {
  munhequeira_preta: { label: 'Munhequeira Preta',  primary: '#1e1e1e', secondary: '#333333', pattern: 'solid' },
  relogio_prata:     { label: 'Relógio Prata',      primary: '#94a3b8', secondary: '#64748b', accent: '#ffffff', pattern: 'solid' },
  bracelete_ouro:    { label: 'Bracelete Ouro',     primary: '#f59e0b', secondary: '#d97706', pattern: 'solid' },
};

// ── SPECIAL (auras, efeitos) ──
export const SPECIAL_VISUALS: Record<string, ItemVisual> = {
  aura_fogo:         { label: 'Aura de Fogo',       primary: '#f97316', secondary: '#ef4444', accent: '#fbbf24', pattern: 'gradient' },
  aura_gelo:         { label: 'Aura de Gelo',       primary: '#38bdf8', secondary: '#7dd3fc', accent: '#e0f2fe', pattern: 'gradient' },
  aura_sombra:       { label: 'Aura Sombra',        primary: '#6b21a8', secondary: '#a855f7', accent: '#581c87', pattern: 'gradient' },
  aura_ouro:         { label: 'Aura Dourada',       primary: '#f59e0b', secondary: '#fbbf24', accent: '#fde68a', pattern: 'gradient' },
};

// ── Resolver: given a slot and item key, return the visual ──

const SLOT_REGISTRY: Record<string, Record<string, ItemVisual>> = {
  equipped_top: TOP_VISUALS,
  equipped_bottom: BOTTOM_VISUALS,
  equipped_shoes: SHOES_VISUALS,
  equipped_accessory: ACCESSORY_VISUALS,
  equipped_head_accessory: HEAD_VISUALS,
  equipped_wrist_accessory: WRIST_VISUALS,
  equipped_special: SPECIAL_VISUALS,
};

export function getItemVisual(slot: string, itemKey: string | null): ItemVisual | null {
  if (!itemKey) return null;
  const registry = SLOT_REGISTRY[slot];
  if (!registry) return null;
  return registry[itemKey] ?? { ...DEFAULT_VISUAL, label: itemKey };
}
