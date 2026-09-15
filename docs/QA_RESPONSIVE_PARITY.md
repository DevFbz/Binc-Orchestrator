# QA — Paridade responsiva Binc OS

Data da verificação: 2026-09-14
Superfície primária: Monitor/Operate

## Objetivo

Verificar por que o comportamento mobile e web do Binc Orchestrator estava divergente e adaptar as funcionalidades recentes do mobile ao shell web.

## Causa-raiz

A aplicação possuía duas implementações de navegação e de conteúdo:

- o desktop usava um sidebar local na home com seções por hash;
- o mobile usava `MobileNav` com links para páginas dedicadas;
- Relatórios, Governança e Terminal tinham lógica duplicada em páginas próprias;
- ações de Jobs e Projetos existiam em uma superfície, mas não na outra.

Isso permitia que uma atualização feita no mobile não chegasse ao shell desktop.

## Correções aplicadas

### Shell e navegação

- criado `src/components/navigation.ts` como contrato único;
- web e mobile passaram a consumir `NAV_ITEMS`;
- mobile passou a ter os oito destinos principais;
- estado ativo mobile usa `aria-current="page"`;
- links mobile usam o mesmo shell/hash do desktop;
- sidebar web é `position: fixed`, `top: 0`, `height: 100dvh`, com largura dinâmica e menu retrátil;
- preferência de sidebar recolhida é persistida localmente;
- arquivos de páginas diretas retornam ao shell Binc OS.

### Conteúdo compartilhado

- `ReportPanel`: filtros e exportação CSV/PDF no shell e na rota `/reports`;
- `GovernancePanel`: workspaces, membros, convite, ativação/suspensão e auditoria;
- `TerminalPanel`: busca, filtros, timeline, composer, confirmação e auditoria;
- Jobs no shell passaram a expor pausar, retomar e executar agora;
- Projetos passaram a expor ativar/desativar na home, lista e detalhes;
- `/finance` deixou de redirecionar para o GitHub e agora leva ao detalhe do CofrinIA dentro do Binc.

### Segurança

- BFF passou a validar o papel da sessão antes de cada mutação;
- permissões independentes para Terminal, membros, projetos e Jobs;
- `reader`/`reviewer` permanecem em leitura;
- confirmações explícitas continuam obrigatórias;
- nenhum token ou segredo foi incluído no cliente.

### Build

- `middleware.ts` foi migrado para `proxy.ts` conforme a convenção do Next.js 16;
- `outputFileTracingRoot` foi definido no `next.config.ts`;
- referências residuais a Roboto foram substituídas por Nunito Sans/Varela Round;

## Matriz de paridade

| Funcionalidade | Web shell | Mobile/direta | Fonte compartilhada |
|---|---:|---:|---|
| Navegação principal | sim | sim | `navigation.ts` |
| Estado ativo | sim | sim | hash/path + `aria-current` |
| Projetos | sim | sim | catálogo/control plane |
| Ativar/desativar projeto | sim | sim | BFF `project_status` |
| Jobs | sim | sim | BFF de Jobs |
| Relatórios | sim | sim | `ReportPanel` |
| Governança | sim | sim | `GovernancePanel` |
| Terminal | sim | sim | `TerminalPanel` |
| CSV/PDF | sim | sim | endpoints server-side |
| RBAC | sim | sim | sessão + BFF + control plane |

## Validações executadas

```text
82 testes Python passando
ESLint sem erros
TypeScript sem erros
Next build sem warnings de middleware/casing
rotas públicas da aplicação renderizadas
/#reports renderizado com filtros e CSV/PDF
/#governance renderizado com workspaces e membros
/#terminal renderizado com timeline e composer
/#tasks renderizado com ações de Jobs
/finance redirecionando para /projects/cofrinia-finance
/reports usando ReportPanel
/onboarding usando GovernancePanel
/terminal usando TerminalPanel
```

## Limitação conhecida

A automação Chrome externa solicitou autorização de remote debugging e não foi repetida sem consentimento. A inspeção foi concluída pelo preview embutido, leitura do DOM renderizado, navegação por hash e validações de build/API. A captura pixel-perfect em viewport desktop nativa continua como validação manual opcional.

## Resultado

A divergência estrutural entre mobile e web foi corrigida no fluxo principal. O contrato de navegação e os componentes operacionais agora são compartilhados, reduzindo o risco de uma nova atualização existir somente em uma dimensão.
