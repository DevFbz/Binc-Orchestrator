# PRD — Integração do Binc ERP ao Binc Orchestrator

## Prompt refinado

> Integrar o projeto privado `https://github.com/DevFbz/binc-atualizado` ao Binc Orchestrator como um projeto independente chamado **Binc ERP**.
>
> O Binc ERP é um sistema de gestão para autopeças e comércio geral, com estoque, vendas/PDV, clientes, trocas e devoluções, relatórios, Binc IA e integração WhatsApp.
>
> O Orchestrator deve catalogar e operar o projeto sem copiar seu código, sem duplicar seu banco e sem substituir o backend proprietário. O ERP permanece no repositório próprio e deve ser conectado ao Binc por um contrato server-side autenticado, com `workspace_id`, `tenant_id` e `project_id` explícitos.
>
> O projeto deve aparecer em **Projetos**, com um card contendo descrição, status, serviço, capacidades e botão **Abrir**. O botão deve abrir o detalhe do Binc ERP, nunca um link externo cru. O detalhe deve exibir status real, integração, revisão de segurança, versão da origem e capacidades.
>
> O projeto começa como **Em preparação** (`preparation`, `repository_only`). Não marcar como operacional até que exista serviço implantado, health check verificável, autenticação, persistência aprovada, isolamento multi-tenant, secrets removidos do código e smoke test real.
>
> Não criar uma seção global de Campanhas para o ERP. Campanhas continuam pertencendo ao projeto Instagram. Não criar uma seção Tarefas duplicada: jobs e agendas pertencem a Automações.
>
> Preservar a navegação simples e responsiva do Binc OS: sidebar fixa/retrátil no desktop, bottom navigation compacta no mobile, tipografia arredondada, estados de loading/erro/vazio/sucesso, ações com confirmação e auditoria.
>
> Antes de qualquer deploy do ERP, auditar e corrigir: `secret_key` hardcoded, CORS com wildcard e credenciais, tokens/passwords no código, túneis SSH/Ngrok embutidos, executáveis/builds/`__pycache__` versionados e qualquer exposição de dados financeiros ou WhatsApp.
>
> Toda mutação deve seguir: sessão/RBAC → confirmação → API do projeto → auditoria → read-back. O navegador nunca recebe tokens do ERP, WhatsApp, banco, Oracle, Ngrok ou control plane.

## Objetivos

- catalogar o Binc ERP no Orchestrator;
- manter o ERP como domínio independente;
- oferecer uma entrada clara pelo catálogo de Projetos;
- estabelecer integração segura e observável;
- preparar operação multi-tenant;
- permitir evolução futura sem duplicar funcionalidades existentes.

## Fora de escopo inicial

- copiar o frontend React/Vite para o Next.js do Orchestrator;
- migrar o ERP para dentro do repositório Binc Orchestrator;
- marcar o ERP como operacional sem serviço real;
- publicar automaticamente no WhatsApp;
- substituir PostgreSQL, Evolution API ou o backend FastAPI do ERP;
- transportar executáveis, builds e caches para o Orchestrator.

## Estado atual verificado

```text
repositório: acessível por Git
revisão observada: 7334cd49cc7825abeed7b09d8f3361241de1c34e
stack: FastAPI + React/Vite/Electron
projeto catalogado: binc-erp
status: preparation
integration_state: repository_only
```

Riscos encontrados na origem:

```text
secret_key hardcoded no backend
CORS allow_origins=["*"] com credenciais
processos SSH/Ngrok embutidos
executáveis versionados
builds versionados
__pycache__ versionado
```

## Sprints

### Sprint ERP-00 — Descoberta e gate de segurança

Entregas:

- inventário de backend, frontend, API, banco e integrações;
- remoção de executáveis, builds e `__pycache__` do versionamento;
- auditoria de secrets e dados sensíveis;
- definição de `workspace_id`, `tenant_id` e `project_id`;
- mapa de riscos e dependências;
- decisão sobre ambiente de execução.

Aceite:

```text
nenhum segredo hardcoded
nenhum artefato binário obrigatório no Git
escopo multi-tenant documentado
risco residual aprovado
```

### Sprint ERP-01 — Catálogo e onboarding no Binc

Status: iniciada/concluída nesta entrega.

Entregas:

- registro `binc-erp` no catálogo;
- repositório e revisão de origem registrados;
- capacidades exibidas;
- status `preparation` visível;
- botão Abrir para detalhe;
- bloqueio de ativação enquanto não houver integração real.

Aceite:

```text
/api/control-plane retorna binc-erp
/projects exibe Binc ERP
/projects/binc-erp exibe o detalhe
status não aparece como operational
```

### Sprint ERP-02 — Contrato de serviço e health check

Entregas:

- serviço FastAPI executando em ambiente controlado;
- endpoint `/health` sem dados sensíveis;
- URL server-side do serviço;
- autenticação entre Binc e ERP;
- timeout, retry e estados `operational`, `degraded`, `failed`;
- read-back do health no detalhe do projeto.

Aceite:

```text
health real consultado
falha do ERP exibida honestamente
nenhum token no navegador
smoke test Vercel → control plane → ERP
```

### Sprint ERP-03 — Hardening do backend

Entregas:

- `secret_key` via secret manager/env seguro;
- CORS com allowlist explícita;
- remoção de credenciais e URLs sensíveis do código;
- validação de payloads;
- rate limit;
- logs sem tokens/PII;
- dependências auditadas;
- backup e recuperação documentados.

Aceite:

```text
security scan aprovado
configuração de produção sem valores no Git
CORS restrito
logs redigidos
```

### Sprint ERP-04 — Multi-tenant e persistência

Entregas:

- workspace/tenant em todos os objetos do ERP;
- isolamento de clientes;
- PostgreSQL validado para produção;
- migrações reprodutíveis;
- contas, produtos, vendas e clientes com escopo explícito;
- auditoria por ator.

Aceite:

```text
tenant A não lê dados do tenant B
resumos financeiros respeitam workspace
testes de isolamento passam
```

### Sprint ERP-05 — Integração de leitura no Orchestrator

Entregas:

- resumo de estoque;
- vendas recentes;
- clientes;
- alertas;
- relatórios do ERP;
- filtros por workspace/tenant;
- cards de estado no detalhe do projeto.

Aceite:

```text
somente dados reais
origem identificada
loading/empty/error implementados
sem duplicar banco no Orchestrator
```

### Sprint ERP-06 — Operações administrativas controladas

Entregas:

- habilitar/desabilitar integração;
- sincronizar dados;
- atualizar configuração permitida;
- RBAC por workspace;
- confirmação e auditoria;
- rollback operacional.

Aceite:

```text
reader/reviewer somente leitura
admin com escopo correto
cada mutação possui auditoria e read-back
```

### Sprint ERP-07 — WhatsApp e Binc IA sob governança

Entregas:

- health da integração WhatsApp;
- status da Evolution API;
- filas e erros de mensagens;
- métricas da Binc IA;
- nenhum segundo gateway concorrente;
- aprovação para ações externas.

Aceite:

```text
mensagens não são duplicadas
status de entrega não é inferido
credenciais permanecem server-side
```

### Sprint ERP-08 — Produção e operação

Entregas:

- domínio/HTTPS estável;
- serviço systemd/containerizado;
- observabilidade;
- alarmes;
- backup testado;
- runbook;
- deploy controlado;
- rollback validado.

Aceite:

```text
serviço reinicia com segurança
health público protegido quando aplicável
smoke E2E aprovado
operação documentada
```

## Definition of Done

```text
contrato implementado
→ segurança revisada
→ testes unitários/integrados
→ isolamento multi-tenant validado
→ health real
→ UI responsiva
→ RBAC e auditoria
→ smoke E2E
→ deploy
→ read-back
→ documentação atualizada
```
