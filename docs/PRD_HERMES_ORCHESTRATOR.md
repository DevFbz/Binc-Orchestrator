# PRD — Plataforma Hermes Orchestrator

**Versão:** 1.0
**Status:** proposta de arquitetura e execução
**Objetivo:** unificar projetos pessoais e empresariais sob o Hermes Agent como orquestrador central.

---

## 1. Visão do produto

Criar uma plataforma de produtividade e operação, inspirada na organização de ferramentas como Slack, que permita ao administrador:

- administrar múltiplos projetos;
- acompanhar status, tarefas, campanhas e pendências;
- gerar relatórios operacionais e financeiros;
- conversar com o Hermes pelo Telegram quando estiver longe do computador;
- executar ações aprovadas remotamente;
- centralizar documentos, logs, métricas e decisões;
- adicionar novos projetos sem reconstruir a infraestrutura.

O Hermes Agent é a camada de orquestração. Os projetos são módulos independentes que expõem capacidades padronizadas ao orquestrador.

## 2. Projetos iniciais

### Projeto A — Instagram Content Operations

Responsabilidades:

- catálogo de produtos;
- geração de legenda;
- geração de prompt de imagem;
- Feed Instagram;
- pacote Story 9:16;
- aprovação via Telegram;
- agenda de publicação;
- histórico de campanhas;
- métricas e Insights.

### Projeto B — CofrinIA Finance

O domínio financeiro oficial fica no repositório independente do CofrinIA Finance:

- registro de receitas e despesas;
- categorias e centros de custo;
- contas e compromissos;
- orçamento;
- fluxo de caixa;
- metas financeiras;
- relatórios periódicos;
- alertas e lembretes;
- consultas pelo WhatsApp e integração controlada com o Hermes.

O Binc Orchestrator apenas cataloga, monitora e integra o CofrinIA pelo bridge oficial. Não deve manter um segundo módulo financeiro/pessoal com o mesmo domínio.

## 3. Princípios de arquitetura

1. Hermes é o orquestrador, não o banco de dados principal.
2. Cada projeto é um módulo isolado e pode evoluir independentemente.
3. Cada cliente/projeto possui `tenant_id` ou `workspace_id` obrigatório.
4. O painel web é a interface administrativa principal.
5. Telegram é a interface remota e conversacional.
6. Ações sensíveis exigem confirmação explícita.
7. Relatórios devem citar período, fonte e status dos dados.
8. Nenhum segredo entra em código, GitHub, Notion ou resposta do Telegram.
9. Eventos e auditoria são append-only.
10. O sistema deve ser idempotente e tolerante a retry.

## 4. Recomendação de deploy

### Escolha recomendada: Vercel + Azure VM

#### Vercel

Usar para:

- frontend Next.js/React;
- dashboard administrativo;
- autenticação da aplicação web;
- páginas, filtros e relatórios;
- API BFF curta, quando necessário;
- deploy contínuo a partir do GitHub.

#### Azure VM

Manter na VM:

- Hermes Gateway;
- Telegram;
- workers long-running;
- scheduler;
- publicador Instagram;
- processamento de arquivos;
- integração Azure Blob;
- jobs que não podem depender de timeout serverless.

#### Banco de dados

Evoluir os JSONs atuais para PostgreSQL gerenciado ou serviço compatível, com:

- tenants;
- usuários e papéis;
- projetos;
- campanhas;
- transações financeiras;
- aprovações;
- jobs;
- auditoria.

#### Azure Blob

Continuar usando container privado para mídias, comprovantes e arquivos, com prefixo por tenant/workspace e SAS temporário.

### Por que não Streamlit como plataforma principal

Streamlit é adequado para:

- protótipo rápido;
- dashboard analítico interno;
- exploração de dados;
- validação de uma ideia.

Não é a melhor base para:

- produto multiusuário semelhante ao Slack;
- navegação complexa;
- RBAC detalhado;
- múltiplos módulos transacionais;
- UX de operação diária;
- integrações com muitas ações e estados.

Pode ser usado posteriormente como painel analítico secundário, nunca como o núcleo da plataforma.

### Decisão arquitetural

```text
Vercel: interface e BFF web
Azure VM: Hermes, Telegram, workers e integrações
PostgreSQL: dados transacionais
Azure Blob: arquivos privados
GitHub: código e CI/CD
Notion: documentação operacional
```

## 5. Usuários e permissões

### Papéis

- `global_admin`: administra toda a plataforma;
- `project_manager`: administra um projeto específico;
- `tenant_manager`: administra um cliente específico;
- `reviewer`: aprova conteúdo ou registros permitidos;
- `reader`: somente leitura.

### Regras

- Projeto Instagram não pode ler transações financeiras sem permissão explícita.
- Módulo financeiro não pode ler tokens ou campanhas Instagram.
- Gestor de um tenant não pode acessar outro tenant.
- Telegram deve respeitar a allowlist de usuários.
- Publicação e ações financeiras sensíveis exigem confirmação explícita.

## 6. Módulos da plataforma

### 6.1 Dashboard

- resumo geral;
- saúde dos serviços;
- projetos ativos;
- tarefas pendentes;
- alertas;
- últimas atividades;
- relatórios recentes.

### 6.2 Projetos

- lista de projetos;
- status;
- responsáveis;
- tarefas;
- dependências;
- cronograma;
- documentação;
- métricas.

### 6.3 Conteúdo Instagram

- catálogo;
- campanhas;
- calendário;
- fila Telegram;
- aprovação;
- Feed;
- Story package;
- histórico;
- Insights.

### 6.4 Finanças pessoais

- receitas;
- despesas;
- contas;
- recorrências;
- orçamento;
- metas;
- fluxo de caixa;
- relatórios;
- alertas.

### 6.5 Relatórios

- relatório executivo global;
- relatório por projeto;
- relatório por tenant;
- relatório de campanhas;
- relatório financeiro;
- relatório de erros;
- relatório de produtividade;
- exportação CSV/PDF futuramente.

### 6.6 Central de automações

- jobs ativos;
- última execução;
- próxima execução;
- duração;
- resultado;
- erro;
- retry;
- pausa/resume;
- aprovação necessária.

### 6.7 Documentação

- documentos técnicos;
- runbooks;
- PRDs;
- decisões arquiteturais;
- changelog;
- links para Notion;
- documentos por projeto.

## 7. Modelo conceitual

```text
User
  └── Membership
        └── Workspace/Tenant
              ├── Project
              │     ├── Module
              │     ├── Task
              │     ├── Job
              │     ├── Report
              │     └── Document
              ├── Credential reference
              ├── Calendar
              ├── Approval policy
              └── Audit events
```

Entidades fundamentais:

- `workspace`;
- `tenant`;
- `project`;
- `module`;
- `campaign`;
- `financial_entry`;
- `task`;
- `job`;
- `approval_request`;
- `report`;
- `audit_event`;
- `document`;
- `integration`.

## 8. Hermes como orquestrador

O Hermes deve:

- receber pedidos pelo Telegram ou painel;
- identificar usuário, workspace e projeto;
- consultar somente as ferramentas autorizadas;
- delegar operações ao módulo correto;
- resumir status;
- gerar relatórios;
- criar tarefas;
- solicitar aprovação;
- executar a ação depois da confirmação;
- registrar o resultado.

### Roteamento esperado

```text
Mensagem Telegram
→ autenticar usuário
→ identificar workspace/projeto
→ classificar intenção
→ selecionar ferramenta/módulo
→ verificar permissão
→ executar leitura ou pedir aprovação
→ responder resumo
→ registrar auditoria
```

### Exemplos

```text
"Como estão meus projetos?"
→ status global de projetos, jobs, erros e pendências

"Como está o Instagram?"
→ status do módulo Instagram, fila e próxima publicação

"Quanto gastei este mês?"
→ resumo financeiro do período autorizado

"Publique a campanha C-123"
→ verificar aprovações e solicitar confirmação se necessário

"Gere um relatório semanal"
→ consolidar projetos, campanhas, finanças e tarefas
```

## 9. Telegram remoto

O Telegram funciona como cockpit remoto:

- consulta de status;
- alertas;
- aprovação de conteúdo;
- confirmação de ações;
- envio de documentos e imagens;
- relatórios resumidos;
- comandos de consulta.

Mensagens de consulta podem ser executadas diretamente quando não causarem efeitos colaterais. Ações de publicação, exclusão, movimentação financeira ou alteração de configuração exigem confirmação explícita.

## 10. Relatórios

### Relatório global

Deve incluir:

- período;
- projetos ativos;
- jobs executados;
- falhas;
- pendências;
- campanhas publicadas;
- resumo financeiro;
- decisões necessárias;
- fontes dos números.

### Relatório Instagram

- campanhas geradas;
- legendas aprovadas;
- imagens recebidas;
- publicações;
- rejeições;
- falhas;
- horários;
- Insights.

### Relatório financeiro

- receitas;
- despesas;
- saldo;
- categorias;
- recorrências;
- compromissos futuros;
- variação versus orçamento;
- alertas.

## 11. Sprints

### Sprint 0 — Consolidação e contrato de arquitetura

**Objetivo:** congelar princípios, módulos e contratos.

Entregáveis:

- PRD aprovado;
- mapa de módulos;
- contrato `tenant_id/workspace_id`;
- política de permissões;
- contrato de eventos;
- contrato de auditoria;
- documentação no Notion.

Aceite:

- nenhum módulo depende de marca específica;
- Instagram e finanças têm fronteiras claras;
- todos os eventos possuem contexto de workspace/projeto.

### Sprint 1 — Plataforma web base

**Objetivo:** criar o shell da plataforma em Next.js/Vercel.

Entregáveis:

- login;
- layout;
- navegação;
- dashboard;
- projetos;
- status de serviços;
- consumo seguro do backend Azure;
- design system.

Aceite:

- login protegido;
- dashboard abre em produção;
- serviços offline aparecem como alerta;
- nenhuma credencial chega ao navegador.

### Sprint 2 — Control plane do Hermes

**Objetivo:** transformar o Hermes em orquestrador de módulos.

Entregáveis:

- registro de módulos;
- catálogo de ferramentas;
- roteamento por intenção;
- contexto de workspace/projeto;
- permissões;
- auditoria;
- health checks.

Aceite:

- Hermes responde status global;
- Hermes identifica projeto correto;
- chamadas proibidas são bloqueadas;
- cada ação tem rastreabilidade.

### Sprint 3 — Integração completa do Instagram

**Objetivo:** migrar o Instagram Studio para o control plane.

Entregáveis:

- campanhas por projeto/tenant;
- calendário;
- Telegram;
- aprovação;
- Feed;
- Story package;
- histórico;
- Insights.

Aceite:

- primeira publicação continua funcionando;
- campanha nunca mistura tenants;
- Telegram aprova por `campaign_id`;
- publicador é idempotente.

### Sprint 4 — Assistente financeiro/pessoal

**Objetivo:** incorporar o projeto financeiro como módulo isolado.

Entregáveis:

- receitas;
- despesas;
- categorias;
- contas;
- recorrências;
- orçamento;
- fluxo de caixa;
- consultas Telegram;
- relatório mensal.

Aceite:

- lançamentos possuem origem e data;
- relatórios informam período;
- dados financeiros nunca aparecem no módulo Instagram sem autorização;
- exclusões exigem confirmação.

### Sprint 5 — Motor unificado de tarefas e jobs

**Objetivo:** administrar automações de todos os projetos.

Entregáveis:

- tarefas;
- jobs;
- recorrência;
- retries;
- deadlines;
- logs;
- alertas Telegram;
- pause/resume.

Aceite:

- cada job mostra última e próxima execução;
- falha gera alerta;
- retry não duplica efeito;
- jobs têm owner e projeto.

### Sprint 6 — Relatórios e documentos

**Objetivo:** consolidar operação e documentação.

Entregáveis:

- relatório global;
- relatórios por projeto;
- relatório Instagram;
- relatório financeiro;
- exportação;
- links Notion;
- histórico de versões.

Aceite:

- relatório informa fonte e período;
- números batem com os módulos;
- relatório pode ser solicitado pelo Telegram;
- documentos são organizados por projeto.

### Sprint 7 — Observabilidade e segurança

**Objetivo:** preparar operação confiável.

Entregáveis:

- logs estruturados;
- métricas;
- alertas;
- backups;
- auditoria;
- RBAC completo;
- rotação de credenciais;
- testes de isolamento;
- disaster recovery runbook.

Aceite:

- incidente pode ser rastreado;
- tenant não acessa outro tenant;
- backup é verificável;
- credenciais não aparecem em logs.

### Sprint 8 — Onboarding de novos clientes e projetos

**Objetivo:** tornar a plataforma extensível.

Entregáveis:

- cadastro de tenant;
- cadastro de projeto;
- seleção de módulos;
- checklist de integração;
- configuração de Telegram;
- credenciais externas;
- calendário;
- brand kit;
- permissões.

Aceite:

- novo cliente não exige alteração de código central;
- dados são isolados desde a criação;
- onboarding produz checklist e auditoria;
- cada módulo pode ser ativado/desativado.

## 12. Critérios não funcionais

### Segurança

- secrets manager ou `.env` seguro na VM;
- tokens nunca no frontend;
- TLS;
- RBAC;
- allowlist Telegram;
- auditoria append-only;
- confirmação para ações sensíveis;
- princípio do menor privilégio.

### Confiabilidade

- idempotência;
- retries com limite;
- timeouts;
- circuit breaker futuro;
- jobs retomáveis;
- backups testados.

### Performance

- dashboard inicial rápido;
- relatórios pesados em background;
- workers fora do request web;
- paginação;
- cache de leituras não sensíveis.

### Privacidade

- dados financeiros privados;
- isolamento por tenant;
- retenção definida;
- exclusão auditada;
- exportação sob autorização.

## 13. Riscos

- Vercel não deve hospedar workers contínuos ou o gateway Telegram.
- Streamlit pode acelerar o MVP, mas gerar retrabalho como plataforma principal.
- JSON deve ser substituído por banco transacional antes de alta concorrência.
- Meta pode limitar permissões, publicação e Insights.
- Stories dependem do suporte oficial do fluxo Meta.
- Cada novo cliente precisa de credenciais e consentimentos próprios.
- Relatórios globais não podem misturar dados sem contexto de origem.

## 14. Prompt mestre para iniciar o desenvolvimento

```text
Você é o arquiteto e agente construtor da plataforma "Hermes Orchestrator".

OBJETIVO
Construir uma plataforma de produtividade e operação, inspirada na organização de ferramentas como Slack, usando o Hermes Agent como orquestrador central de múltiplos projetos. O painel web administra projetos, tenants, tarefas, jobs, relatórios, documentos, integrações e auditoria. O Telegram permite consultar o status e executar fluxos aprovados quando o administrador estiver longe do computador.

PROJETOS INICIAIS
1. Instagram Content Operations: catálogo, campanhas, legendas, prompts, aprovação Telegram, Feed Instagram, pacote Story, calendário, histórico e Insights.
2. CofrinIA Finance: domínio financeiro oficial, operado no repositório próprio e integrado pelo bridge Hermes.

REGRA FUNDAMENTAL
Magú Moto Peças Filho é apenas o primeiro cliente/tenant do módulo Instagram. Nunca trate essa marca, catálogo, token, calendário ou regras como globais. A plataforma deve aceitar muitos clientes e projetos independentes.

ARQUITETURA OBRIGATÓRIA
- Vercel para frontend Next.js/React e camada web curta.
- Azure VM para Hermes Gateway, Telegram, workers, scheduler, publicadores e processos long-running.
- PostgreSQL para dados transacionais quando a migração dos JSONs começar.
- Azure Blob privado para imagens, comprovantes e arquivos, com Managed Identity e SAS temporário.
- GitHub para código e CI/CD.
- Notion para documentação detalhada, runbooks, PRDs e decisões.

ISOLAMENTO
Todo objeto deve carregar workspace_id, tenant_id e/ou project_id conforme o domínio. Usuários, tokens, catálogos, marcas, campanhas, transações, relatórios, calendários, Telegram, Instagram, mídias e auditoria devem ficar isolados. Nenhum módulo pode consultar dados de outro módulo sem permissão explícita.

HERMES
O Hermes é o orquestrador. Ele identifica usuário, workspace e projeto; classifica intenção; seleciona ferramentas; verifica permissões; executa leituras; solicita confirmações; executa ações aprovadas; resume resultados e registra auditoria.

TELEGRAM
O Hermes Gateway é o único processo que faz polling do Telegram. Consultas podem responder diretamente. Publicação, exclusão, movimentação financeira, alteração de configuração e outras ações sensíveis exigem confirmação explícita. Mensagens ambíguas como "ok", emojis ou "pode ir" não aprovam ações.

INSTAGRAM
Fluxo Feed: criar campanha → gerar legenda e prompt → aprovação da legenda → imagem → revisão final → Blob privado → SAS temporário → media container → aprovação final → media_publish → histórico e IDs Meta.
Stories devem ser gerados em pacote 9:16 e publicados manualmente quando o fluxo oficial da Meta não suportar publicação automática.

FINANCEIRO
Toda movimentação deve ter data, valor, categoria, conta, origem, status e tenant/workspace. Relatórios devem informar período, fonte e limitações. Exclusão e ações irreversíveis exigem confirmação.

RELATÓRIOS
Criar relatórios globais, por projeto, Instagram, financeiro, erros, produtividade e jobs. Relatórios longos devem rodar em background e ser entregues no painel e Telegram. Toda métrica deve informar período e fonte.

SPRINTS
Executar em ordem:
Sprint 0 — contrato de arquitetura e consolidação.
Sprint 1 — plataforma web base em Vercel.
Sprint 2 — control plane do Hermes.
Sprint 3 — integração completa do Instagram.
Sprint 4 — módulo financeiro/pessoal.
Sprint 5 — tarefas e jobs unificados.
Sprint 6 — relatórios e documentos.
Sprint 7 — observabilidade e segurança.
Sprint 8 — onboarding de novos clientes/projetos.

METODOLOGIA
Usar TDD: escrever teste, observar falha, implementar mínimo, observar sucesso, refatorar. Fazer commits pequenos por sprint. Validar localmente, na VM Azure e no GitHub. Não declarar uma sprint concluída sem critério de aceite verificado.

SEGURANÇA
Nunca imprimir, commitar ou documentar tokens, senhas ou chaves. Nunca publicar sem aprovação explícita. Nunca usar Blob público permanente. Nunca misturar tenants. Nunca inventar dados, valores financeiros, especificações de produto, descontos ou métricas.

ENTREGÁVEIS DE CADA SPRINT
- código;
- testes;
- documentação;
- migrações/configuração;
- critérios de aceite verificados;
- status de deploy;
- riscos e bloqueios externos;
- commit no GitHub.

COMECE PELA SPRINT 0. Antes de codificar, inspecione os dois projetos existentes, preserve o funcionamento atual e produza o mapa de integração e o contrato de dados multi-tenant.
```

## 15. Definição de pronto global

A plataforma só será considerada pronta quando:

- painel web estiver publicado;
- Hermes responder pelo Telegram sobre os projetos;
- Instagram estiver integrado sem quebrar publicação existente;
- finanças estiverem isoladas e auditáveis;
- jobs e relatórios estiverem visíveis;
- novos tenants puderem ser cadastrados sem código específico;
- backups e recuperação forem testados;
- nenhum segredo estiver em GitHub, Notion, frontend ou logs.
