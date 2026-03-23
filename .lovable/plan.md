

# Migrar TvMode.tsx para ler dados do Supabase

## Situação Atual
O arquivo `TvMode.tsx` lê WOD, check-ins e duelos exclusivamente do `localStorage`, o que impede a TV de receber atualizações feitas em outros dispositivos.

## O que muda
Substituir as 3 funções de leitura (`getStoredDailyWod`, `getTvCheckins`, `getTvDuels`) por queries diretas ao Supabase, mantendo o polling de 10s já existente.

## Plano

### 1. Importar o cliente Supabase
Adicionar `import { supabase } from "@/integrations/supabase/client"` no topo do arquivo.

### 2. Substituir `getStoredDailyWod` por query Supabase
- Buscar na tabela `wods` o registro com `date = hoje` (formato ISO `YYYY-MM-DD`)
- Mapear os campos `name`, `type`, `warmup`, `skill`, `versions` (jsonb) para o tipo `DailyWod`
- Se não houver WOD para hoje, retornar `null`

### 3. Substituir `getTvCheckins` por query Supabase
- Buscar na tabela `checkins` registros com `check_date = hoje`
- Filtrar por horário da aula atual usando `created_at` (timestamp)
- Fazer join com `profiles` para obter o nome do atleta
- Manter a lógica de `getCurrentClass()` e `CLASS_SCHEDULE` intacta
- Se não houver aula ativa, retornar array vazio

### 4. Substituir `getTvDuels` por query Supabase
- Buscar na tabela `app_duels` registros com `status` in ('pending', 'active')
- Fazer join com `profiles` para obter nomes de challenger e opponents
- Limitar a 8 resultados

### 5. Tornar a função `load` assíncrona
- O `useEffect` já faz polling a cada 10s; a função `load` passará a ser `async`
- Adicionar `try/catch` para não quebrar em caso de erro de rede
- Manter `setNow(new Date())` no final

### 6. Remover código morto
- Remover `safeParse` (não será mais usado)
- Remover `getStoredDailyWod`, `getTvCheckins`, `getTvDuels` como funções standalone

### 7. Nota sobre RLS
- A tela `/tv` provavelmente roda sem autenticação (navegador da TV)
- As tabelas `wods`, `checkins` e `profiles` têm RLS com `SELECT` para `authenticated` only
- **Problema**: sem login, as queries retornarão vazio
- **Solução**: adicionar políticas `SELECT` para `anon` nas tabelas `wods`, `checkins` e `profiles`, ou usar uma sessão autenticada na TV
- Vou perguntar a preferência antes de implementar

## Arquivos alterados
- `src/pages/TvMode.tsx` (único arquivo modificado)
- Possivelmente: migração SQL para adicionar políticas `anon` se necessário

## O que NÃO muda
- Layout e visual da `/tv`
- `CLASS_SCHEDULE` e `getCurrentClass()`
- Nenhuma outra tela ou lógica do app

