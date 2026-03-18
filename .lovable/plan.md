

## Plano: Unificar botão de check-in no Dashboard

### Problema atual

O Dashboard tem **três elementos separados** para check-in (linhas 297-317):
1. Botão "Verificar localização" — valida GPS
2. Botão "Confirmar presença hoje (+25 XP)" — faz o check-in e dá XP
3. `DominationEnergyButton` "Faça check-in para gerar energia" — gera energia do time **após** o check-in

Isso confunde o usuário com duas ações sequenciais para algo que deveria ser uma única ação.

### Solução

Unificar os passos 2 e 3 em **um único botão**. Ao clicar "Fazer check-in", o código:
1. Executa o `handleCheckIn` existente (salva check-in, dá XP, atualiza perfil)
2. Logo em seguida, chama `generateDominationEnergyForActivity` automaticamente (a mesma função que o `DominationEnergyButton` usa) para gerar energia do time

O botão "Verificar localização" permanece inalterado.

### Mudanças

**Arquivo único: `src/pages/Dashboard.tsx`**

1. **Importar** `generateDominationEnergyForActivity` e `hasGeneratedDominationEnergy` de `@/lib/clanSystem` (já importa `getUserClan` e `getCheckInXpReward` dali)

2. **No `handleCheckIn`** (linhas 218-254): após o check-in ser bem-sucedido (após `updateUser` e toast), chamar `generateDominationEnergyForActivity` com os mesmos parâmetros que o `DominationEnergyButton` usava:
   - `userId: user.id`
   - `activityId: \`checkin:${today}\``
   - `activityType: 'checkin'`
   - `energy: 20`
   - `participationValid: true`

3. **Atualizar o texto do botão** (linha 304): de `Confirmar presença hoje (+${checkInXpReward} XP)` para `Fazer check-in (+${checkInXpReward} XP e energia)`

4. **Remover** o componente `<DominationEnergyButton>` (linhas 306-316) e seu import (linha 15)

5. **Adicionar feedback** da energia gerada no toast de sucesso (incluir info do time se aplicável)

6. **Corrigir o erro de build** na linha 99: adicionar `category` ao tipo `StoredUserProgress` ou fazer cast adequado para `ensureClanData`

### O que NÃO muda

- Nenhuma regra de negócio alterada
- `handleVerifyLocation` permanece idêntico
- `calculateDistanceMeters` permanece
- Validação de localização via `activeLocation` + `isInsideAllowedArea` permanece
- A chamada RPC `perform_location_checkin` permanece
- `generateDominationEnergyForActivity` em `clanSystem.ts` não é alterada
- Nenhum outro arquivo é modificado

