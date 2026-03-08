

## Plano: Corrigir conflitos de merge e implementar ranking completo

### Problema
Três arquivos têm marcadores de conflito git (`<<<<<<`, `=======`, `>>>>>>`) que quebram o build:
- `src/lib/mockData.ts`
- `src/pages/Leaderboard.tsx`  
- `src/pages/Dashboard.tsx`

### Correções

**1. `src/lib/mockData.ts`** — Resolver conflitos nos mock users (linhas 134-203) e nos resultados (linhas 267-400):
- Manter `gender` e `category` em cada mock user
- Manter mock checkins
- Remover entradas duplicadas de resultados (res_1 aparece duas vezes)
- Limpar todos os marcadores de conflito

**2. `src/pages/Leaderboard.tsx`** — Reescrever limpo combinando ambas as versões:
- 4 tabs: RX, Scaled, Iniciante, Frequência
- Dentro de cada tab de categoria: sub-tabs Masculino / Feminino
- Ranking baseado em resultados de WODs (score por posição) filtrado por gênero
- Tab Frequência: ranking por check-ins no mês, sem filtro de gênero
- Manter filtro por box

**3. `src/pages/Dashboard.tsx`** — Resolver conflitos nos imports e seções:
- Manter botão de check-in com +25 XP
- Manter card de presenças no mês
- Manter card do WOD do dia
- Limpar imports duplicados e marcadores

### Lógica de ranking por categoria + gênero

Para cada combinação (ex: RX Masculino):
1. Filtrar resultados de WODs onde `category === 'rx'`
2. Filtrar users onde `gender === 'male'`
3. Cruzar: só resultados de users masculinos
4. Pontuar por posição em cada WOD (100 pts 1o, 85 pts 2o, etc.)
5. Somar pontos totais e ordenar

### Arquivos alterados
| Arquivo | Ação |
|---|---|
| `src/lib/mockData.ts` | Resolver conflitos, manter gender+category+checkins |
| `src/pages/Leaderboard.tsx` | Reescrever com ranking por categoria+gênero+frequência |
| `src/pages/Dashboard.tsx` | Resolver conflitos, manter checkin+WOD do dia |

