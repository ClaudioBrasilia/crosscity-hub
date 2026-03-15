# Configuração do Supabase - CrossCity Hub

Este guia ajudará você a conectar o projeto CrossCity Hub ao Supabase.

## Pré-requisitos
- Conta no [Supabase](https://supabase.com/)
- Node.js instalado localmente
- Git configurado

---

## Passo 1: Criar um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/) e faça login com sua conta do GitHub.
2. Clique em **"New Project"** ou **"Create a new project"**.
3. Preencha os dados:
   - **Project Name:** `crosscity-hub`
   - **Database Password:** Escolha uma senha forte (salve-a em um lugar seguro!)
   - **Region:** Escolha a região mais próxima (ex: `South America - São Paulo`)
4. Clique em **"Create new project"** e aguarde a criação (pode levar alguns minutos).

---

## Passo 2: Obter as Credenciais de API

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem no canto inferior esquerdo).
2. Clique em **API** no menu lateral.
3. Você verá:
   - **Project URL** (ex: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** (sua chave pública)
4. Copie esses valores.

---

## Passo 3: Configurar Variáveis de Ambiente

1. Na raiz do seu projeto, crie um arquivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Abra o arquivo `.env.local` e preencha com suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seu_projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

3. **IMPORTANTE:** Nunca faça commit do arquivo `.env.local`. Ele já está no `.gitignore`.

---

## Passo 4: Criar o Schema do Banco de Dados

1. No painel do Supabase, vá em **SQL Editor** (ícone de código no menu lateral).
2. Clique em **"New Query"**.
3. Abra o arquivo `scripts/supabase-schema.sql` do seu projeto.
4. Copie todo o conteúdo e cole no editor SQL do Supabase.
5. Clique em **"Run"** para executar o script.

---

## Passo 5: Habilitar Autenticação (Opcional, mas Recomendado)

1. No painel do Supabase, vá em **Authentication** > **Providers**.
2. Habilite o **Email** (já está habilitado por padrão).
3. Para login com GitHub (recomendado):
   - Clique em **GitHub**.
   - Siga as instruções para criar um OAuth App no GitHub.
   - Cole o `Client ID` e `Client Secret` no Supabase.

---

## Passo 6: Testar a Conexão

1. No seu projeto local, instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra o navegador em `http://localhost:5173` e verifique se não há erros no console.

---

## Próximos Passos: Migração do localStorage

O projeto ainda usa `localStorage` para armazenar dados. Para migrar gradualmente para o Supabase:

1. **Importar as funções auxiliares** em seus componentes:
   ```typescript
   import { fetchUser, updateUserXP, fetchDuels } from '@/lib/supabaseHelpers';
   ```

2. **Substituir chamadas do localStorage** por chamadas ao Supabase:
   ```typescript
   // Antes:
   const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');

   // Depois:
   const users = await supabase.from('users').select('*');
   ```

3. **Usar React Query** para cache e sincronização automática (já está configurado no projeto).

---

## Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe e tem as variáveis corretas.
- Reinicie o servidor de desenvolvimento após criar o arquivo `.env.local`.

### Erro: "CORS policy"
- Vá em **Project Settings** > **API** > **CORS**.
- Adicione `http://localhost:5173` (ou seu domínio) à lista de URLs permitidas.

### Erro: "Row Level Security (RLS) violation"
- Verifique se as políticas de RLS foram criadas corretamente.
- Certifique-se de que o usuário está autenticado antes de fazer queries.

---

## Documentação Útil
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## Suporte
Se tiver dúvidas, consulte a documentação oficial do Supabase ou abra uma issue no repositório.
