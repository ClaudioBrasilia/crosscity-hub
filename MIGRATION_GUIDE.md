# Guia de Migração: localStorage → Supabase

Este guia explica como migrar gradualmente o projeto de `localStorage` para o **Supabase**, mantendo a compatibilidade com o código existente.

---

## Estratégia de Migração

Recomendamos uma abordagem **gradual e incremental**:

1. **Fase 1:** Configurar o Supabase e criar o schema (✅ Já feito)
2. **Fase 2:** Implementar autenticação com Supabase Auth
3. **Fase 3:** Migrar dados de usuários
4. **Fase 4:** Migrar duelos e dados de competição
5. **Fase 5:** Migrar dados secundários (badges, benchmarks, etc.)

---

## Fase 2: Autenticação com Supabase Auth

### Antes (localStorage):
```typescript
// src/contexts/AuthContext.tsx
const mockUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
const user = mockUsers.find((u: any) => u.id === userId);
```

### Depois (Supabase):
```typescript
import { supabase } from '@/lib/supabase';
import { onAuthStateChange } from '@/lib/supabaseAuth';

// Dentro do AuthContext
useEffect(() => {
  const { data: { subscription } } = onAuthStateChange((user) => {
    if (user) {
      // Buscar dados do usuário do Supabase
      fetchUserProfile(user.id);
    }
  });

  return () => subscription?.unsubscribe();
}, []);
```

---

## Fase 3: Migrar Dados de Usuários

### Exemplo: Dashboard.tsx

**Antes:**
```typescript
const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
const userWins = Number(localStorage.getItem(`crosscity_wins_${user?.id}`) || '0');
```

**Depois:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
  },
});

const { data: userWins } = useQuery({
  queryKey: ['user-wins', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('duels')
      .select('*')
      .eq('winner_id', user?.id);
    if (error) throw error;
    return data?.length || 0;
  },
  enabled: !!user?.id,
});
```

---

## Fase 4: Migrar Duelos

### Exemplo: Battle.tsx

**Antes:**
```typescript
const loadedDuels = JSON.parse(localStorage.getItem('crosscity_duels') || '[]');
const saveDuels = (items: Duel[]) => {
  localStorage.setItem('crosscity_duels', JSON.stringify(items));
};
```

**Depois:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const queryClient = useQueryClient();

const { data: duels } = useQuery({
  queryKey: ['duels'],
  queryFn: async () => {
    const { data, error } = await supabase.from('duels').select('*');
    if (error) throw error;
    return data;
  },
});

const createDuelMutation = useMutation({
  mutationFn: async (duelData: any) => {
    const { data, error } = await supabase
      .from('duels')
      .insert([duelData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['duels'] });
  },
});

const createDuel = () => {
  createDuelMutation.mutate({
    challenger_id: user?.id,
    opponent_id: opponentId,
    wod_id: wodId,
    wod_name: selectedWod.name,
    category,
    status: 'pending',
    bet_mode: betMode,
    bet_type: betType === 'xp' ? 'xp' : null,
    bet_xp_amount: betXpAmount,
  });
};
```

---

## Fase 5: Dados Secundários

Migre gradualmente:
- **Benchmarks** → `benchmarks` table
- **Achievements/Badges** → `achievements` table
- **Check-ins** → `checkins` table

---

## Padrão Recomendado: React Query + Supabase

Para manter o código limpo e eficiente, use **React Query** (já instalado) com Supabase:

```typescript
// Hook customizado para buscar dados
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    },
  });
}

// Uso no componente
function MyComponent() {
  const { data: users, isLoading } = useUsers();
  
  if (isLoading) return <div>Carregando...</div>;
  return <div>{users?.length} usuários</div>;
}
```

---

## Checklist de Migração

- [ ] Configurar Supabase (URL e chaves)
- [ ] Criar schema do banco de dados
- [ ] Implementar autenticação com Supabase Auth
- [ ] Migrar dados de usuários
- [ ] Migrar duelos e competições
- [ ] Migrar benchmarks
- [ ] Migrar achievements
- [ ] Migrar check-ins
- [ ] Testar todas as funcionalidades
- [ ] Deploy em produção

---

## Troubleshooting

### Erro: "Cannot read property 'id' of undefined"
Certifique-se de que o usuário está autenticado antes de fazer queries:
```typescript
const { data: user } = await supabase.auth.getUser();
if (!user) return; // Não fazer queries se não estiver autenticado
```

### Erro: "RLS policy violation"
Verifique se as políticas de RLS estão corretas no Supabase:
1. Vá em **Authentication** > **Policies**
2. Verifique se as políticas permitem as operações que você está tentando fazer

### Dados não aparecem em tempo real
Use **Real-time Subscriptions** do Supabase:
```typescript
const subscription = supabase
  .from('duels')
  .on('*', (payload) => {
    console.log('Duel updated:', payload.new);
    // Atualizar estado local
  })
  .subscribe();
```

---

## Recursos Úteis

- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Supabase + React Query Integration](https://supabase.com/docs/guides/realtime/usage)
