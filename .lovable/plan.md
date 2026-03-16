

## Plano: Migrar autenticação e papeis para Supabase

### Resumo

Migrar o sistema de auth de localStorage para Supabase Auth + tabelas `profiles` e `user_roles`. O admin continua mudando papeis manualmente pelo painel `/admin`. Sem convites, sem auditoria.

---

### 1. Criar tabelas no Supabase (migration SQL)

**Tabela `profiles`** -- dados do usuario vinculados a `auth.users`:
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar text default '👤',
  gender text default 'male' check (gender in ('male','female')),
  category text default 'beginner' check (category in ('rx','scaled','beginner')),
  box_id text,
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  checkins integer default 0,
  wins integer default 0,
  battles integer default 0,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
```

**Tabela `user_roles`** -- papeis separados (conforme boas praticas):
```sql
create type public.app_role as enum ('athlete','coach','admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'athlete',
  unique (user_id, role)
);
alter table public.user_roles enable row level security;
```

**Funcao `has_role`** (security definer, evita recursao RLS):
```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
```

**Funcao para pegar o papel do usuario**:
```sql
create or replace function public.get_user_role(_user_id uuid)
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = _user_id limit 1
$$;
```

**Trigger para criar profile + role automaticamente no signup**:
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','Atleta'), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'athlete');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**RLS Policies**:
- `profiles`: SELECT para todos autenticados; UPDATE apenas proprio perfil
- `user_roles`: SELECT para todos autenticados; INSERT/UPDATE/DELETE apenas admins (via `has_role`)

---

### 2. Reescrever `AuthContext.tsx`

Substituir toda logica de localStorage por Supabase Auth:

- **Estado**: escutar `onAuthStateChange` para detectar login/logout
- **login()**: chamar `supabase.auth.signInWithPassword()`
- **register()**: chamar `supabase.auth.signUp()` com `raw_user_meta_data: { name, gender, category }` -- o trigger cria o profile
- **logout()**: chamar `supabase.auth.signOut()`
- **user**: ao detectar sessao, buscar `profiles` + `user_roles` para montar o objeto User completo
- **updateUser()**: fazer `supabase.from('profiles').update(...)` 
- **getAllUsers()**: fazer `supabase.from('profiles').select('*, user_roles(role)')` 
- **setUserRole()**: fazer `supabase.from('user_roles').upsert(...)` -- apenas admin pode (RLS garante)
- **resetPassword()**: chamar `supabase.auth.resetPasswordForEmail()`
- Manter whitelist `ADMIN_EMAILS` como fallback para o primeiro admin (se o role no banco nao existir ainda)

---

### 3. Atualizar `Login.tsx`

Minimo de mudancas -- o formulario ja esta correto. Apenas garantir que `register()` passa `name`, `gender`, `category` como metadata.

---

### 4. Atualizar `Admin.tsx`

- `getAllUsers()` agora retorna dados do Supabase (async)
- `setUserRole()` agora faz upsert na tabela `user_roles`
- Tornar o componente async-aware (usar estado de loading)

---

### 5. Atualizar trigger do profile

O trigger `handle_new_user` vai ler `gender` e `category` do `raw_user_meta_data` para preencher o profile completo no signup.

---

### Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Criar `profiles`, `user_roles`, funcoes, trigger, RLS |
| `src/contexts/AuthContext.tsx` | Reescrever para usar Supabase Auth + queries |
| `src/pages/Login.tsx` | Ajustar metadata no registro |
| `src/pages/Admin.tsx` | Buscar usuarios e mudar papeis via Supabase |

### O que NAO muda
- Rotas permanecem iguais
- Interface do Admin permanece igual (select de papel por usuario)
- Cadastro publico continua criando apenas atleta
- Sem convite, sem log de auditoria

