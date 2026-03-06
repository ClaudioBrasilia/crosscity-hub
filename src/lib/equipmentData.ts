export interface Equipment {
  id: string;
  name: string;
  emoji: string;
  tier: number;
  winsRequired: number;
  description: string;
}

export const equipmentCatalog: Equipment[] = [
  // Tier 1 (1-3 vitórias)
  { id: 'eq_1', name: 'Cones', emoji: '🔶', tier: 1, winsRequired: 1, description: 'Cones de agilidade' },
  { id: 'eq_2', name: 'Jump Rope', emoji: '🪢', tier: 1, winsRequired: 1, description: 'Corda de pular speed rope' },
  { id: 'eq_3', name: 'Abmat', emoji: '🟫', tier: 1, winsRequired: 2, description: 'Abmat para sit-ups' },
  { id: 'eq_4', name: 'Timer', emoji: '⏱️', tier: 1, winsRequired: 2, description: 'Timer digital de parede' },
  { id: 'eq_5', name: 'Chalk', emoji: '🤍', tier: 1, winsRequired: 3, description: 'Magnésio líquido' },
  { id: 'eq_6', name: 'Foam Roller', emoji: '🧻', tier: 1, winsRequired: 3, description: 'Rolo de liberação miofascial' },
  // Tier 2 (4-8 vitórias)
  { id: 'eq_7', name: 'Kettlebell', emoji: '🏋️', tier: 2, winsRequired: 4, description: 'Kettlebell 24kg' },
  { id: 'eq_8', name: 'Dumbbell', emoji: '💪', tier: 2, winsRequired: 5, description: 'Par de dumbbells ajustáveis' },
  { id: 'eq_9', name: 'Medicine Ball', emoji: '⚽', tier: 2, winsRequired: 5, description: 'Medicine ball 20lb' },
  { id: 'eq_10', name: 'Wall Ball', emoji: '🎯', tier: 2, winsRequired: 6, description: 'Wall ball 20lb com alvo' },
  { id: 'eq_11', name: 'Box Jump', emoji: '📦', tier: 2, winsRequired: 7, description: 'Caixa de salto 24"' },
  { id: 'eq_12', name: 'Band', emoji: '🔴', tier: 2, winsRequired: 8, description: 'Kit de resistance bands' },
  // Tier 3 (9-15 vitórias)
  { id: 'eq_13', name: 'Barbell', emoji: '🏋️‍♂️', tier: 3, winsRequired: 9, description: 'Barra olímpica 20kg' },
  { id: 'eq_14', name: 'Squat Rack', emoji: '🔩', tier: 3, winsRequired: 10, description: 'Rack de agachamento' },
  { id: 'eq_15', name: 'Pull-up Bar', emoji: '🪜', tier: 3, winsRequired: 11, description: 'Barra fixa de parede' },
  { id: 'eq_16', name: 'Rings', emoji: '🔵', tier: 3, winsRequired: 12, description: 'Argolas de ginástica' },
  { id: 'eq_17', name: 'Plates', emoji: '🔘', tier: 3, winsRequired: 13, description: 'Kit de anilhas bumper' },
  { id: 'eq_18', name: 'Bench', emoji: '🪑', tier: 3, winsRequired: 15, description: 'Banco de supino ajustável' },
  // Tier 4 (16-24 vitórias)
  { id: 'eq_19', name: 'Rower', emoji: '🚣', tier: 4, winsRequired: 16, description: 'Remo Concept2' },
  { id: 'eq_20', name: 'Assault Bike', emoji: '🚴', tier: 4, winsRequired: 18, description: 'Assault Air Bike' },
  { id: 'eq_21', name: 'Rope Climb', emoji: '🧗', tier: 4, winsRequired: 20, description: 'Corda naval 5m' },
  { id: 'eq_22', name: 'Ski Erg', emoji: '⛷️', tier: 4, winsRequired: 21, description: 'Ski Erg Concept2' },
  { id: 'eq_23', name: 'Pegboard', emoji: '📌', tier: 4, winsRequired: 23, description: 'Pegboard de competição' },
  { id: 'eq_24', name: 'Podium', emoji: '🏆', tier: 4, winsRequired: 24, description: 'Pódio de campeão!' },
];

export const getUnlockedEquipment = (totalWins: number): Equipment[] => {
  return equipmentCatalog.filter(eq => totalWins >= eq.winsRequired);
};

export const getNextEquipment = (totalWins: number): Equipment | null => {
  return equipmentCatalog.find(eq => totalWins < eq.winsRequired) || null;
};

export const getTierColor = (tier: number): string => {
  switch (tier) {
    case 1: return 'text-muted-foreground';
    case 2: return 'text-secondary';
    case 3: return 'text-primary';
    case 4: return 'text-primary';
    default: return 'text-muted-foreground';
  }
};

export const getTierLabel = (tier: number): string => {
  switch (tier) {
    case 1: return 'Bronze';
    case 2: return 'Prata';
    case 3: return 'Ouro';
    case 4: return 'Diamante';
    default: return '';
  }
};
