# Troubleshooting: erro 403 no npm/bun e `vite` indisponível

Este guia prioriza a causa raiz mais comum nesse cenário: falha de acesso ao registry (403), que impede baixar dependências e, por consequência, deixa o `vite` indisponível para `lint`, `build` e `dev`.

## 0) Caminho rápido (recomendado)

Use o instalador automatizado com suporte a registry privado + token:

```bash
# opcional: exporte o registry corporativo e token
export NPM_REGISTRY_URL="https://SEU_REGISTRY_PRIVADO/"
export NPM_TOKEN="***"

./scripts/install-deps.sh
# opcional: remover também lockfiles se estiverem inconsistentes
CLEAN_LOCKS=1 ./scripts/install-deps.sh
```

Esse script:
- gera um `.npmrc` temporário (não persiste token no repositório),
- testa conectividade com e sem proxy e escolhe automaticamente o melhor modo,
- tenta `bun install` primeiro,
- faz fallback para `npm install` se o Bun falhar.

## 1) Diagnóstico rápido

Execute no root do projeto:

```bash
./scripts/doctor-registry.sh
```

Ou manualmente:

```bash
npm config get registry
npm config list -l | rg -i 'registry|proxy|token'
cat .npmrc 2>/dev/null || true
cat ~/.npmrc 2>/dev/null || true
npm view vite version --loglevel=error
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u npm_config_http_proxy -u npm_config_https_proxy npm view vite version --loglevel=error
```

> Se `npm view vite version` falhar com `403`, o problema não é do Vite; é de acesso ao registry.

> Dica: ajuste timeout dos checks se sua rede é lenta: `CHECK_TIMEOUT_SEC=30 ./scripts/doctor-registry.sh` e `CHECK_TIMEOUT_SEC=30 ./scripts/install-deps.sh`.

## 2) Corrigir configuração de registry/autenticação

### Cenário A — registry público (npmjs)

Crie/ajuste `.npmrc` no projeto:

```ini
registry=https://registry.npmjs.org/
always-auth=false
```

Se houver proxy corporativo, mantenha proxy correto (via env vars ou npm config):

```bash
npm config set proxy http://SEU_PROXY:PORTA
npm config set https-proxy http://SEU_PROXY:PORTA
# teste alternativo sem proxy (se proxy retornar 403)
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy npm view vite version --loglevel=error
```

### Cenário B — registry privado (Artifactory/Nexus/GitHub Packages)

Use o endpoint da sua empresa e token:

```ini
registry=https://SEU_REGISTRY_PRIVADO/
always-auth=true
//SEU_REGISTRY_PRIVADO/:_authToken=${NPM_TOKEN}
```

Depois exporte token e valide:

```bash
export NPM_TOKEN=***
npm whoami --registry=https://SEU_REGISTRY_PRIVADO/
```

> Se seu time usar escopo (`@empresa`), inclua também:
>
> ```ini
> @empresa:registry=https://SEU_REGISTRY_PRIVADO/
> ```

## 3) Limpar estado e reinstalar dependências

```bash
rm -rf node_modules
rm -f bun.lockb package-lock.json
npm cache clean --force
bun pm cache rm || true
```

Tente primeiro com Bun:

```bash
bun install
```

Se ainda houver 403, use npm como fallback operacional:

```bash
npm install
```

## 4) Verificar Vite e scripts

```bash
node -e "const p=require('./package.json'); console.log('dev=',p.scripts.dev,'build=',p.scripts.build,'vite=',(p.devDependencies||{}).vite||(p.dependencies||{}).vite)"
ls -l node_modules/.bin/vite
```

Esperado:
- `scripts.dev` contém `vite`
- `scripts.build` contém `vite build`
- `node_modules/.bin/vite` existe

## 5) Validação final

```bash
npm run lint
npm run build
bun run dev --host 0.0.0.0 --port 4173
```

Fallback se Bun continuar bloqueado no ambiente:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

## 6) Notas importantes

- Erro `vite: command not found` normalmente é **efeito colateral** de instalação incompleta.
- Corrigir registry/auth geralmente resolve `lint`, `build` e `dev` em sequência.
- Se este ambiente bloquear acesso externo por política, valide em uma rede com acesso ao seu registry corporativo.
