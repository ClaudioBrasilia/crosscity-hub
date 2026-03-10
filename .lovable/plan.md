

## Onboarding Personalizado + Melhorias Visuais

Três funcionalidades principais a implementar:

### 1. Tour Interativo (Onboarding)

**Novo arquivo `src/components/OnboardingTour.tsx`**:
- Componente overlay com 5 passos sequenciais:
  1. **Bem-vindo** — Card central explicando o BoxLink
  2. **WOD** — Destaca ícone WOD na navbar: "Registre seus treinos diários"
  3. **Duelos** — Destaca Duelos: "Desafie outros atletas"
  4. **Ranking** — Destaca Ranking: "Veja sua posição"
  5. **Menu** — Destaca botão ≡: "Acesse Benchmarks, Desafios e mais"
- Overlay escuro (`bg-black/60`) com spotlight no elemento ativo
- Card flutuante com glassmorphism, botões "Pular" e "Próximo", indicador de progresso (dots)
- Animações `animate-fade-in` existentes

**`src/contexts/AuthContext.tsx`**: Após `register()`, salvar `localStorage.setItem('crosscity_onboarding_' + id, 'pending')`

**`src/components/Layout.tsx`**: Renderizar `<OnboardingTour />` quando flag for `'pending'`; ao concluir/pular, marcar `'done'`

### 2. Questionário de Metas (Goals)

**Novo arquivo `src/components/GoalsQuestionnaire.tsx`**:
- Modal exibido após o tour (ou no primeiro acesso), com 2-3 perguntas:
  - Objetivo principal: Ganhar força / Perder peso / Melhorar condicionamento / Competir
  - Frequência semanal: 3x / 4x / 5x / 6x+
  - Nível de experiência: Iniciante / Intermediário / Avançado
- Salva em `localStorage` (`crosscity_goals_{userId}`)
- Exibido no Dashboard como card resumo das metas do atleta

**`src/pages/Dashboard.tsx`**: Novo card "Minhas Metas" com ícone e resumo dos objetivos definidos

### 3. Personalização de Tema

**`src/pages/Profile.tsx`**: Nova seção "Tema" com 4 opções de cor primária:
- Azul (atual), Verde, Roxo, Laranja
- Ao selecionar, salva em `localStorage` e aplica CSS variables dinamicamente via `document.documentElement.style.setProperty`

**`src/components/Layout.tsx`**: No mount, carregar tema salvo e aplicar as CSS variables

### 4. Animações Dinâmicas no Dashboard

**`src/pages/Dashboard.tsx`**:
- Adicionar classes `animate-fade-in` com delays escalonados nos cards (style `animationDelay`)
- Barra de XP com animação de preenchimento (transição suave ao carregar)
- Números de stats com efeito de contagem animada simples (counter via `useEffect`)

---

Todas as alterações usam `localStorage` e componentes existentes (sem backend). O tour e o questionário aparecem apenas uma vez por usuário.

