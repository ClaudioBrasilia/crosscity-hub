

## Plano: Sistema Completo — Benchmarks, Batalha Virtual, Meu Box e Apostas de Equipamentos

### Visão Geral

Implementar 4 novas funcionalidades interligadas:

1. **Benchmarks** — Registrar PRs de exercícios-chave
2. **Batalha Virtual** — Simulação automática baseada nos benchmarks
3. **Meu Box** — Garagem virtual com equipamentos conquistados
4. **Apostas** — Atletas nível 10+ podem apostar equipamentos em batalhas

### Arquivos a criar

**`src/lib/battleSimulator.ts`** — Motor de simulação:
- Mapeia cada WOD para benchmarks relevantes (Fran → Thruster + Pull-ups)
- Calcula score: `(benchmarks * peso) + (XP * 0.1) + (level * 50) ± 10% random`
- For Time: menor score = mais rápido. AMRAP: maior score = mais rounds
- Retorna ranking com tempos simulados

**`src/lib/equipmentData.ts`** — Catálogo de 24 equipamentos em 4 tiers:
- Tier 1 (1-3 vitórias): Cones 🔶, Jump Rope 🪢, Abmat, Timer, Chalk, Foam Roller
- Tier 2 (4-8): Kettlebell, Dumbbell, Medicine Ball, Wall Ball, Box Jump, Band
- Tier 3 (9-15): Barbell, Squat Rack, Pull-up Bar, Rings, Plates, Bench
- Tier 4 (16-24): Rower, Assault Bike, Rope Climb, Ski Erg, Pegboard, Podium 🏆

**`src/pages/Benchmarks.tsx`** — Registrar/editar PRs, ver ranking do box por exercício

**`src/pages/Battle.tsx`** — Escolher WOD + oponentes, animação de barras de progresso, resultado com pódio. Modo normal (+150 XP) e modo aposta (nível 10+: cada jogador aposta 1 equipamento, vencedor leva tudo)

**`src/pages/MyBox.tsx`** — Grid visual dos 24 equipamentos (desbloqueados coloridos, trancados em cinza). Barra de progresso geral. Seção mostrando equipamentos ganhos em apostas

### Arquivos a modificar

- **`src/lib/mockData.ts`**: Adicionar `benchmarkExercises`, mock benchmarks para os 5 users, mock inventários
- **`src/contexts/AuthContext.tsx`**: Adicionar `wins`, `battles` ao User
- **`src/components/Layout.tsx`**: 3 novos nav items (Benchmarks, Batalha, Meu Box)
- **`src/App.tsx`**: 3 novas rotas
- **`src/pages/Dashboard.tsx`**: Cards de vitórias e equipamentos

### Sistema de Apostas (Nível 10+)

- Ao criar batalha, opção "Apostar Equipamento" aparece se nível ≥ 10
- Cada participante seleciona 1 equipamento do seu inventário para apostar
- Equipamentos apostados ficam "bloqueados" durante a batalha
- Vencedor recebe todos os equipamentos apostados
- Perdedor perde o equipamento apostado (removido do inventário)
- Ícone especial 🎰 nas batalhas com aposta no histórico

### Fluxo do Usuário

1. Registra PRs em Benchmarks
2. Inicia Batalha → escolhe WOD e oponentes
3. Se nível 10+: pode ativar modo aposta e selecionar equipamento
4. Animação de corrida com barras de progresso
5. Vencedor ganha equipamento do catálogo (normal) ou equipamentos dos oponentes (aposta)
6. Meu Box atualiza com novos itens
7. Post automático no feed com resultado

