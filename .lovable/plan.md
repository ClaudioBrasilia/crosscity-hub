

## Plano: Mostrar detalhes do WOD ao clicar no duelo

### Situação atual
Na Arena de Duelos (`Battle.tsx`), cada duelo mostra apenas o nome do WOD e os participantes. O usuário não consegue ver a descrição do treino sem sair da página.

### Solução
Adicionar um estado `expandedDuelId` que controla qual duelo está expandido. Ao clicar no card do duelo, ele expande/colapsa mostrando os detalhes do WOD associado (descrição, tipo, peso) na categoria selecionada.

### Mudanças em `src/pages/Battle.tsx`

1. **Novo estado**: `const [expandedDuelId, setExpandedDuelId] = useState<string | null>(null)`

2. **Tornar o cabeçalho do duelo clicável**: envolver o bloco do nome/badges (linhas 590-604) em um `div` com `onClick` que alterna `expandedDuelId`

3. **Seção expandida**: quando `expandedDuelId === duel.id`, buscar o WOD correspondente em `wods` via `duel.wodId` e renderizar:
   - Tipo do WOD (For Time / AMRAP / EMOM)
   - Descrição da versão na categoria do duelo (`duel.category`)
   - Peso recomendado
   - Estilizado com fundo sutil e ícone de treino

4. **Feedback visual**: cursor pointer no cabeçalho, ícone chevron que rotaciona, transição suave

### O que NÃO muda
- Nenhuma lógica de duelo alterada
- Criação, aceitação, submissão e liquidação permanecem iguais
- Nenhum outro arquivo modificado

