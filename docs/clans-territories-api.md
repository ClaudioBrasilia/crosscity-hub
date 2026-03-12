# Sistema de Clãs e Territórios — Proposta de API

## Modelos de dados

- **Clan**: `id`, `name`, `motto`, `banner`, `color`, `createdAt`.
- **ClanMembership**: `userId`, `clanId`, `role` (`member|mentor|captain`), `joinedAt`.
- **Territory**: `id`, `name`, `icon`, `focus`, `rotationOrder`.
- **TerritoryBattle**: `id`, `territoryId`, `period` (`daily|weekly`), `startsAt`, `endsAt`, `winnerClanId`.
- **DominationEvent**: `id`, `battleId`, `userId`, `clanId`, `source` (`checkin|challenge|bonus`), `energy`.
- **ClanRewardGrant**: `id`, `clanId`, `rewardType` (`real|digital|power`), `payload`, `grantedAt`.

## Endpoints sugeridos

- `GET /v1/clans` — lista clãs e métricas agregadas.
- `POST /v1/clans/auto-balance` — distribui alunos em clãs (sem validação de equilíbrio de nível/categoria nesta etapa).
- `GET /v1/clans/:clanId` — detalhes do clã, membros e histórico.
- `GET /v1/territories` — territórios e ocupação atual.
- `POST /v1/checkins` — registra check-in e cria `DominationEvent`.
- `GET /v1/territories/current-battle` — batalha ativa e placar em tempo real.
- `POST /v1/territories/close-period` — encerra período e define vencedor.
- `POST /v1/rewards/distribute` — distribui recompensas para o clã vencedor.

## Regras de negócio

1. Cada check-in gera energia base (ex.: `20`).
2. Bônus opcional para horários de pico (`+5`) e streak (`+10`).
3. Vencedor do período = maior energia acumulada.
4. Empate resolve por: maior presença única, depois maior média de nível.
5. Clã vencedor recebe recompensa real + digital + bônus de poder configurável.
