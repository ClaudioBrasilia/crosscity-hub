

## Resultado Único por Atleta por WOD

### Situação Atual
O código já detecta submissões duplicadas, mas apenas dentro da **mesma categoria**. Um atleta pode registrar resultado em RX, Scaled e Beginner para o mesmo WOD. Além disso, ao resubmeter na mesma categoria, o resultado é atualizado (sobrescrito), mas o XP e streak são somados novamente.

### Plano

**1. Restringir a 1 resultado por atleta por WOD (qualquer categoria)**
- Em `src/pages/WOD.tsx`, alterar a busca de resultado existente para ignorar a categoria:
  ```
  existing = results.find(r => r.wodId === wod.id && r.userId === user.id)
  ```
- Se já existe resultado, o atleta pode **editar** (atualizar tempo/rounds e até trocar de categoria), mas não criar um segundo registro.

**2. Evitar XP duplicado**
- Só conceder XP e incrementar streak quando for a **primeira submissão** (não quando for edição).
- Ao editar, atualizar o resultado sem somar XP novamente.

**3. Feedback visual**
- Se o atleta já registrou resultado, mostrar o formulário em modo "editar" com o valor anterior preenchido e um label "Atualizar resultado" no botão.
- Travar o seletor de categoria após a primeira submissão ou permitir troca (a definir — recomendo permitir troca para flexibilidade).

### Arquivos Alterados
- `src/pages/WOD.tsx` — lógica de submissão e UI do formulário

