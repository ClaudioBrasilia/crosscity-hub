# Quick Start - CrossCity Hub + Supabase

Seu projeto Supabase **CrossLink** já foi criado! Agora siga estes passos para deixar tudo funcionando.

---

## Passo 1: Obter a Anon Key

1. No painel do Supabase, clique em **"API Keys"** no menu lateral esquerdo.
2. Copie a chave **`anon public`** (ela começa com `eyJhbGc...`).
3. Abra o arquivo `.env.local` no seu projeto local (crie se não existir).
4. Cole o seguinte conteúdo:
   ```env
   VITE_SUPABASE_URL=https://vjkxaspdtsxwksnoqdoq.supabase.co
   VITE_SUPABASE_ANON_KEY=cole_sua_anon_key_aqui
   ```

---

## Passo 2: Criar o Schema do Banco de Dados

1. No painel do Supabase, clique em **"SQL Editor"** (ícone de código no menu lateral).
2. Clique em **"New Query"**.
3. Abra o arquivo `scripts/supabase-schema.sql` do seu projeto no editor de texto.
4. Copie **TODO** o conteúdo do arquivo.
5. Cole no editor SQL do Supabase.
6. Clique em **"Run"** (botão verde no canto inferior direito).
7. Aguarde a execução. Você deve ver mensagens de sucesso.

---

## Passo 3: Testar a Conexão Localmente

1. No terminal, na pasta do projeto, execute:
   ```bash
   npm run dev
   ```

2. Abra o navegador em `http://localhost:5173`.

3. Abra o **Console do Navegador** (F12 ou Cmd+Option+I).

4. Se não houver erros vermelhos sobre "Missing Supabase environment variables", está funcionando!

---

## Passo 4: Próximos Passos

Agora você pode começar a migrar o código do `localStorage` para o Supabase:

- Leia o arquivo **MIGRATION_GUIDE.md** para ver exemplos de como substituir o código antigo.
- Use as funções em `src/lib/supabaseHelpers.ts` e `src/lib/supabaseAuth.ts` nos seus componentes.

---

## Troubleshooting Rápido

**Erro: "Missing Supabase environment variables"**
- Certifique-se de que o arquivo `.env.local` existe e tem as variáveis corretas.
- Reinicie o servidor (`npm run dev`).

**Erro: "CORS policy"**
- Vá em **Project Settings** > **API** > **CORS**.
- Adicione `http://localhost:5173` à lista de URLs permitidas.

**Erro ao rodar o SQL**
- Verifique se há erros de sintaxe no script.
- Tente rodar o script em partes (divida em múltiplas queries).

---

## Dúvidas?

Consulte:
- **SUPABASE_SETUP.md** - Guia completo de configuração
- **MIGRATION_GUIDE.md** - Como migrar o código
- [Supabase Docs](https://supabase.com/docs)
