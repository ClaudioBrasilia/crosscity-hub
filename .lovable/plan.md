

## Corrigir erros de build em duelLogic.ts e WOD.tsx

### Problema

Dois erros de TypeScript:
1. `duelLogic.ts` importa `User` de `mockData`, mas esse tipo não existe lá — está em `AuthContext.tsx`
2. `WOD.tsx` importa `pickWinner` de `duelLogic`, mas a função se chama `calculateWinner`

### Solução

**1. `src/lib/duelLogic.ts`** — Remover import de `User` e definir um tipo local mínimo + exportar alias `pickWinner`

- Substituir `import type { Duel, User } from './mockData'` por `import type { Duel } from './mockData'`
- Adicionar tipo local: `type DuelUser = { id: string; xp: number; [key: string]: any }`
- Substituir todas as referências a `User` por `DuelUser`
- Exportar `pickWinner` como alias de `calculateWinner`: `export const pickWinner = calculateWinner`

**2. `src/pages/WOD.tsx`** — Remover import de `pickWinner` (já tem função local com mesmo nome)

- Linha 15: remover `pickWinner` do import de `duelLogic` (a função `pickWinner` local nas linhas 68-100 já faz o mesmo trabalho)

### Arquivos modificados
- `src/lib/duelLogic.ts`
- `src/pages/WOD.tsx`

