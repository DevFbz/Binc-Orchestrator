# PRD — Binc OS: Dashboard Operacional, UX e Verdade do Estado

**Status:** aprovado para execução incremental
**Versão:** 1.0
**Data:** 2026-09-12
**Produto:** Binc Orchestrator
**Repositório:** `https://github.com/DevFbz/Binc-Orchestrator`

## 1. Objetivo

Transformar o dashboard do Binc em um shell operacional real: a opção selecionada na navegação desktop deve permanecer ativa e substituir o conteúdo da Visão geral no mesmo espaço; os dados exibidos devem vir do control plane; a interface deve usar Binc OS, Roboto e uma composição de Monitor/Operate sem elementos decorativos que pareçam funcionalidades inexistentes.

A experiência mobile já possui o menu inferior e deve ser preservada. Esta fase corrige principalmente desktop/tablet e o Terminal Telegram.

## 2. Problemas confirmados

1. A navegação lateral desktop usa âncoras ou rotas que levam para páginas separadas em vez de trocar o conteúdo no shell.
2. O dashboard possui `activities` e `automation` estáticos, que podem exibir ações nunca realizadas.
3. O estado do job de pré-revisão não é refletido nas automações exibidas.
4. O catálogo do dashboard precisa tratar o CofrinIA como projeto operacional ativo.
5. A marca `hermesOS` deve ser substituída por `Binc OS`.
6. Instagram e CofrinIA não devem aparecer novamente como “Módulos” quando já são projetos no catálogo.
7. Busca, notificações e perfil devem abrir popovers flutuantes reais, com posicionamento, foco, fechamento e estados vazios.
8. O Terminal Telegram precisa ter composição de chatbot: timeline rolável, composer fixo/estável e seleção de conversa sem obrigar o usuário a rolar toda a página.
9. A tipografia atual deve migrar para Roboto com fallback seguro.
10. Rotas e controles sem comportamento devem possuir destino, handler ou estado desabilitado explicado.

## 3. Escopo

### Incluído

- shell desktop persistente do Binc OS;
- navegação com estado ativo;
- conteúdo por seção no mesmo shell;
- Visão geral, Projetos, Tarefas, Automações, Governança, Relatórios, Documentação, Terminal;
- dados reais de projetos, jobs, health, auditoria e eventos;
- remoção de atividades fictícias;
- automações derivadas dos jobs reais;
- catálogo com CofrinIA `operational`;
- remoção de Instagram/CofrinIA da seção duplicada de módulos;
- popovers flutuantes de busca, notificações e perfil;
- Roboto;
- Terminal com layout de chatbot e composer acessível;
- menu mobile existente preservado;
- testes de contrato, navegação, estados e smoke test;
- documentação e critérios de aceite.

### Fora de escopo

- mudar o domínio oficial do CofrinIA;
- duplicar o banco financeiro do CofrinIA;
- criar segundo bot Telegram;
- substituir Hermes Gateway;
- publicação automática no Instagram;
- inserir tokens no GitHub, frontend, logs ou PRD;
- redesign completo do CofrinIA WhatsApp;
- rollback destrutivo em produção.

## 4. Arquitetura e fonte de verdade

```text
Browser
  → Next.js BFF server-side
  → Binc Control Plane :8791
  → Instagram Studio :8787
  → CofrinIA Bridge :8790
```

Fontes:

- projetos: `project_registry`;
- jobs: `job_registry`;
- saúde: `observability`;
- atividades: `audit_log` e eventos reais;
- Terminal: `event_store`;
- campanhas: Instagram proxy;
- CofrinIA: health do bridge e projeto catalogado.

Nenhuma atividade ou automação deve ser criada somente para preencher espaço visual.

## 5. Design e UX

### Postura

A Visão geral é uma superfície **Monitor**. Projetos, Jobs e Terminal são superfícies **Operate/Inspect**.

Regras:

- hierarquia por estado e ação;
- um único acento laranja, sucesso verde, atenção âmbar e erro vermelho;
- sem gradientes decorativos como substituto de hierarquia;
- sem métricas fictícias;
- ícones Lucide;
- Roboto para texto e `DM Mono` somente para IDs/estados técnicos;
- alvos de toque com pelo menos 44px;
- foco visível e nomes acessíveis;
- `prefers-reduced-motion` respeitado;
- desktop não deve mostrar o menu mobile.

### Navegação desktop

A barra lateral deve manter:

```text
Visão geral
Projetos
Tarefas
Automações
Governança
Relatórios
Documentação
Terminal
```

Ao selecionar uma opção:

- o item recebe estado ativo persistente;
- o conteúdo principal é substituído no mesmo shell;
- a URL deve ser atualizada quando houver rota canônica;
- o conteúdo anterior não deve continuar visível como duplicação;
- o estado deve sobreviver a refresh quando a rota for direta.

A seção “Módulos” com Instagram e CofrinIA será removida. Os dois aparecem em Projetos.

### Visão geral

Mostrar somente dados consultados:

- projetos operacionais;
- contagem real de campanhas/publicações quando disponível;
- jobs e próximas ações derivadas do registro;
- saúde dos três serviços;
- atividade recente derivada da auditoria/eventos.

Quando um dado não existir:

```text
—
Nenhum evento registrado
Não configurado
Indisponível
```

### Popovers

Busca, notificações e perfil devem abrir um elemento flutuante com:

- `role="dialog"` ou `role="menu"` adequado;
- foco inicial;
- fechamento por Escape;
- fechamento ao clicar fora;
- botão/controle com `aria-expanded`;
- estado vazio honesto;
- posicionamento independente do fluxo de cards.

### Terminal

O terminal deve ter:

```text
coluna/área de conversas
timeline com rolagem própria
composer fixado na área visível
seleção de conversa
texto e imagem
confirmação antes de envio
status sent/failed/unknown
```

O composer nunca deve enviar sem confirmação. O conteúdo não deve incluir conversas financeiras.

## 6. Jobs e atividades

A home não pode exibir horários ou títulos hardcoded como se fossem eventos atuais.

Cada automação deve ser derivada de:

```text
job_id
project_id
tenant_id
status
schedule
next_action
approval_required
```

Atividades devem vir de:

```text
audit events
Telegram events
job action audit
health changes
```

Se não houver uma atividade real, exibir estado vazio.

## 7. CofrinIA

O projeto oficial é:

```text
cofrinia-finance
https://github.com/DevFbz/CofrinIA---Agente-Financeiro
```

Estado esperado atual:

```text
operational
cofrinia-hermes-bridge.service
127.0.0.1:8790
```

O dashboard deve exibi-lo no catálogo de Projetos, com status real. Não criar um segundo módulo financeiro no Binc.

## 8. Critérios de aceite

### Navegação

- [x] opção selecionada fica ativa no desktop;
- [x] conteúdo selecionado substitui Visão geral no shell;
- [x] Tarefas, Jobs, Projetos, Governança, Relatórios, Documentação e Terminal têm destinos funcionais;
- [x] refresh em rota canônica mantém a seção;
- [x] menu mobile continua funcional.

### Dados

- [x] zero atividade fictícia na Visão geral;
- [x] próximas automações derivadas de jobs reais;
- [x] pausa/resume refletida no dashboard após leitura do control plane;
- [x] CofrinIA aparece como `operational`;
- [x] health dos três serviços é consultado;
- [x] estados indisponível/vazio são explícitos.

### Popovers

- [x] busca abre flutuante;
- [x] notificações abrem flutuante;
- [x] perfil abre flutuante;
- [x] Escape fecha;
- [x] clique externo fecha;
- [x] foco e ARIA funcionam.

### Terminal

- [x] timeline tem rolagem própria;
- [x] composer fica visível sem rolar a página inteira;
- [x] mensagem de texto exige confirmação;
- [x] imagem valida MIME, assinatura e tamanho;
- [x] resultado real é exibido sem falso sucesso;
- [x] auditoria é registrada.

### Qualidade

- [x] Roboto aplicado com fallback;
- [x] `npm run lint` sem erros ou warnings novos relevantes;
- [x] build de produção aprovado;
- [x] smoke HTTP das rotas;
- [x] testes Python completos;
- [x] nenhum segredo no código, logs ou Git;
- [ ] inspeção pixel-perfect desktop nativa — bloqueada por autorização de remote debugging; DOM, preview embutido e build foram verificados.

## 9. Sprints desta fase

### Sprint UX-01 — Shell e navegação desktop

- layout persistente;
- seção ativa;
- conteúdo no mesmo shell;
- rotas canônicas;
- remover módulos duplicados.

### Sprint UX-02 — Verdade operacional

- substituir atividades estáticas;
- jobs reais na home;
- estado de CofrinIA;
- health e auditoria recentes.

### Sprint UX-03 — Popovers e tipografia

- Roboto;
- busca;
- notificações;
- perfil;
- foco, Escape e clique externo.

### Sprint UX-04 — Terminal chatbot

- timeline independente;
- composer fixo/estável;
- seleção de conversa;
- texto/imagem;
- estados de envio.

### Sprint UX-05 — QA e hardening visual

- desktop/tablet/mobile;
- acessibilidade;
- estados vazios/erro/loading;
- build, smoke e revisão visual;
- documentação final.

## 10. Definition of Done

Uma sprint só pode ser marcada como concluída quando:

```text
código implementado
→ testes passando
→ build passando
→ rotas verificadas
→ fonte real conferida
→ UI inspecionada
→ documentação atualizada
→ commit remoto confirmado
```

Nenhuma integração externa deve ser declarada concluída sem retorno real verificável.
