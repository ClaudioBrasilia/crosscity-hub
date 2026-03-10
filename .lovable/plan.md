

## Remover credenciais demo da tela de login

Remover o bloco com emails e senhas de demonstração que aparece na aba "Entrar" da tela de login.

### Alteração

**`src/pages/Login.tsx`** (linhas 168-175):
- Remover o `<div>` com as credenciais demo (Professor e Atleta) que fica logo abaixo do botão "Entrar".

Mudança simples — apenas deletar 8 linhas. A tela de login ficará limpa, sem expor dados de acesso.

