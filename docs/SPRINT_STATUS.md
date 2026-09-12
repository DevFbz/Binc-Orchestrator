# Status de Sprints — Implementação e Limites Externos

Atualizado em 2026-09-12.

## Sprints concluídas no código e na VM

- Sprint 0: infraestrutura Azure/Hermes/Telegram/Meta/Blob.
- Sprint 1: tenants, overview administrativo e calendário por tenant.
- Sprint 2: conteúdo `product`, `informative`, `marketing` e `holiday`.
- Sprint 3: parser Telegram estrito, auditoria e plugin de aprovação.
- Sprint 4: caminhos Blob por tenant/campanha, SAS no publicador, retenção e dry-run.
- Sprint 5: slots por tenant e recomendação de horários por Insights.
- Sprint 6: pacote Story 9:16 aprovado para publicação manual.
- Sprint 7: onboarding mínimo, RBAC e log JSONL append-only.
- Sprint 8: painel de onboarding, governança e autenticação web server-side.
- Sprint 9: estrutura financeira persistente por workspace (legado, não catalogado como projeto).
- Sprint 10: unificação do domínio financeiro no CofrinIA Finance.
- Sprint 11: integração monitorada do Binc com o bridge oficial do CofrinIA.
- Sprint 12–16 planejadas: confiabilidade do dashboard, eventos, terminal administrativo, composer e hardening.
- Sprint 13: contrato validado e ingestão idempotente de eventos Telegram do Instagram; adaptador do Hermes criado para emissão assíncrona.
- Adaptador `deploy/hermes-binc-events` instalado no Hermes; 10 eventos reais já persistidos e disponíveis no terminal.
- Sprint 14: terminal administrativo somente leitura com eventos reais, busca, filtros e candidatos de campanha sem seleção automática ambígua.
- Sprint 15: composer de texto e imagem via `hermes send`, confirmação explícita, idempotência, outbox, armazenamento privado temporário, auditoria e envio real controlado validados.
- Sprint 16 em execução: rate limit de mutações, headers de segurança e métricas operacionais agregadas; runbook operacional e smoke test público concluídos; E2E completo, rollback executado e threat model ainda pendentes.
- Sprint 17 planejada: responsividade mobile e menu flutuante inferior para navegação.

## Validações

```text
55 testes Python passando no Binc Orchestrator
lint ESLint sem erros
build Next.js de produção concluído, incluindo a rota `/terminal`
arquivos Python compilados na VM
instagram-studio.service ativo
plugin instalado em ~/.hermes/plugins/instagram-approval
allowlist local criada a partir de TELEGRAM_ALLOWED_USERS sem exibir valores
```

## Passo operacional pendente

O plugin foi instalado, mas o gateway precisa ser reiniciado fora do próprio processo do gateway:

```bash
hermes gateway restart
```

Isso deve ser executado em uma sessão SSH separada, não por um comando filho do gateway.

## Sprint 9 — Estrutura financeira persistente (legado)

Entregue:

- armazenamento JSON atômico para categorias, contas e recorrências;
- isolamento obrigatório por `workspace_id`;
- confirmação explícita para toda mutação;
- prevenção de categorias e contas duplicadas dentro do mesmo workspace;
- validação de categoria e conta ao criar recorrências;
- vínculo opcional de conta em lançamentos financeiros;
- rotas protegidas de leitura e criação no control plane;
- proxy server-side no Next.js;
- interface para cadastrar e consultar categorias, contas e recorrências;
- bloqueio das leituras de configuração e das mutações financeiras no BFF sem sessão `global_admin` válida;
- auditoria de cada criação.

Critérios verificados:

```text
GET /api/finance/setup retorna somente o workspace solicitado
POST de categoria, conta e recorrência exige confirm=true
recorrência não aceita referências de outro workspace
campos nulos não são convertidos em textos válidos
BFF não encaminha configuração ou mutação financeira sem sessão administrativa válida
smoke test HTTP: 1 categoria, 1 conta, 1 recorrência e 3 eventos de auditoria
34 testes Python passando
npm run lint passando
npm run build passando
```

Limite desta sprint: recorrências são definições persistidas. A materialização automática não será ampliada no Binc; o domínio oficial deve permanecer no CofrinIA.

## Sprint 10 — CofrinIA como único projeto financeiro

Entregue:

- removido `personal-finance-assistant` do catálogo de projetos;
- mantido somente `cofrinia-finance` como projeto financeiro;
- jobs, workspace pessoal e auditoria financeira apontam para `cofrinia-finance`;
- dashboard exibe o CofrinIA e não oferece o módulo financeiro duplicado como projeto;
- identificação visual do administrador atualizada para Breno.

## Sprint 11 — Integração monitorada com o bridge do CofrinIA

Entregue:

- bridge oficial verificado em `127.0.0.1:8790`;
- serviço `cofrinia-hermes-bridge.service` ativo;
- endpoint `/health` respondendo com status `ok`;
- Binc passou a consultar o health do bridge em `/api/system/health`;
- status do bridge classificado como `operational`, `degraded` ou `failed`;
- integração coberta por testes automatizados;
- nenhum endpoint financeiro ou domínio do CofrinIA foi duplicado no Binc.

Validação em produção local:

```text
binc-control-plane: operational
instagram-studio: operational
cofrinia-hermes-bridge: operational
36 testes Python passando
npm run lint passando
npm run build passando
```

## Dependências externas não falsificadas como concluídas

- Cada novo cliente exige configuração própria e credenciais próprias.
- App Review/Advanced Access da Meta depende da análise da Meta.
- Stories permanecem em pacote aprovado/manual devido à limitação oficial do fluxo de Content Publishing.
- Insights reais só podem ser calculados depois de dados e permissões suficientes.
- Integração de uma conta Whimsical depende de sessão autenticada do usuário.

## Regra multi-tenant

Magú Moto Peças Filho é apenas o primeiro tenant. Nenhum módulo deve usar sua marca, catálogo, token ou calendário como padrão global quando houver um tenant explícito.
