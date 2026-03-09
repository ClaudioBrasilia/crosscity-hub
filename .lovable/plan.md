

## Aposta de XP ou Equipamento nos Duelos

### O que muda

Adicionar a opção de escolher o **tipo de aposta** ao criar um duelo (nível 10+):
- **Equipamento** — funciona como já existe (cada um aposta 1 item, vencedor leva)
- **XP** — cada atleta aposta uma quantidade de XP (ex: 100, 200, 500). Vencedor ganha o XP apostado pelo oponente; perdedor perde esse XP

### Alterações

**`src/lib/mockData.ts`** — Atualizar tipo `Duel`:
- Adicionar campo `betType: 'equipment' | 'xp' | null`
- Adicionar campo `betXpAmount: number | null`

**`src/pages/Battle.tsx`**:
- Após ativar modo aposta, mostrar seletor: "Apostar Equipamento" ou "Apostar XP"
- Se XP: campo numérico para definir quantidade (mínimo 50, máximo = XP atual do atleta)
- Na resolução do duelo:
  - Se aposta XP: vencedor recebe `+betXpAmount` XP, perdedor recebe `-betXpAmount` XP (mínimo 0)
  - Se aposta equipamento: lógica atual (transferir item)
- Badge visual diferente no histórico: 🎰 equipamento, ⚡ XP

### Regras
- Nível mínimo 10 para ambos os tipos de aposta (mantém regra atual)
- XP do perdedor não pode ficar negativo (floor em 0)
- Level recalculado após alteração de XP

