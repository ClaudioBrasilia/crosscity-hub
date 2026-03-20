

## Plano: Corrigir erro de build — remover chamada RPC inexistente

### Problema

O `Dashboard.tsx` linha 219 chama `supabase.rpc('perform_location_checkin', ...)` mas essa função RPC não existe no banco. A validação de distância já é feita client-side em `handleVerifyLocation` (linhas 191-197