# Binc OS — Contrato visual e de navegação

## Superfície

Binc OS é um painel **Monitor/Operate**. A interface deve priorizar estado verificável, contexto e ação segura.

## Navegação principal

```text
Visão geral → /
Projetos → /projects
Automações → /jobs
Governança → /onboarding
Relatórios → /reports
Terminal → /terminal
Documentação → /docs
```

`Tarefas` não é uma seção independente. Jobs, agenda e execução pertencem a `Automações`.

`Campanhas` não é um módulo global. Elas aparecem dentro de `/projects/instagram-content-operations` na aba `Campanhas`.

## Projeto

A lista de Projetos tem uma ação principal única:

```text
Abrir → detalhes do projeto
```

Ações administrativas de ativar/desativar ficam no detalhe e exigem confirmação, RBAC, persistência e auditoria.

## Shell

- sidebar persistente e viewport-height no desktop;
- conteúdo independente pode rolar sem mover a sidebar;
- bottom navigation compacta no mobile com no máximo cinco destinos visíveis;
- destinos secundários entram em `Mais`;
- todos os controles têm foco visível e estado ativo explícito;
- conteúdo recebe compensação para safe-area no mobile.

## Visual

- fundo escuro neutro e superfícies planas;
- Roboto para UI;
- DM Mono somente para IDs, estados e metadados;
- Lucide para ícones funcionais;
- um acento laranja e cores semânticas de sucesso/atenção/erro;
- bordas discretas, sem gradiente decorativo ou glassmorphism;
- cards usados para agrupamento de informação, não como decoração;
- textos operacionais específicos, sem slogans genéricos.

## Responsividade

Breakpoints mínimos de QA:

```text
375px
720px
1024px
1440px
```

Regras:

- sem rolagem horizontal inesperada;
- alvos touch com pelo menos 44px;
- composer do Terminal sempre acessível;
- tabelas/listas quebram texto longo;
- navegação secundária não cobre conteúdo;
- estados de loading, vazio, erro e sucesso são visíveis.

## Dados

Nenhuma tela pode fabricar:

```text
atividade
próxima automação
status de serviço
métrica
publicação
notificação
```

Toda ação administrativa deve seguir:

```text
confirmação → sessão/RBAC → backend autoritativo → auditoria → read-back
```
