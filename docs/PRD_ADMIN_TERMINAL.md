# PRD — Terminal Administrativo do Hermes no Binc Orchestrator

**Status:** aprovado para refinamento e execução incremental
**Versão:** 1.0
**Data:** 2026-09-12
**Dono:** Breno / Hermes
**Repositórios envolvidos:** Binc Orchestrator, Hermes Gateway e InstagramAutomationPostHermes, cada um preservando sua responsabilidade.

## 1. Problema

O painel administrativo do Binc apresenta alguns controles sem comportamento funcional e não oferece uma visão operacional do diálogo entre o usuário e o bot. O administrador precisa conseguir acompanhar uma solicitação, identificar qual campanha/post foi referido e, quando necessário, responder pelo canal oficial como Hermes, com transparência, confirmação e auditoria.

## 2. Objetivo

Criar um terminal administrativo seguro, dentro do Binc, que permita:

1. acompanhar mensagens recebidas e enviadas pelo bot;
2. pesquisar por usuário, telefone/identificador mascarado, workspace, tenant, campanha ou `campaign_id`;
3. identificar o post/campanha solicitado e exibir seu estado, legenda, mídia e aprovações;
4. anexar uma imagem pelo painel e enviar uma resposta pelo canal oficial;
5. enviar texto como resposta operacional do bot, sempre registrando que foi uma ação administrativa assistida;
6. corrigir os botões e destinos quebrados do dashboard;
7. preservar isolamento multi-tenant, aprovação humana, segurança e trilha de auditoria.

## 3. Fora de escopo

- criar um segundo bot Telegram;
- fazer polling do Telegram pelo frontend ou pelo Binc;
- duplicar campanhas ou o domínio Instagram no Binc;
- duplicar o CofrinIA Finance;
- expor token do Telegram, Meta, WhatsApp ou control plane no navegador;
- publicar no Instagram automaticamente sem as aprovações existentes;
- alterar o fluxo de movimentações financeiras do CofrinIA.

## 4. Princípios obrigatórios

- O Hermes Gateway continua sendo o único processo que conversa diretamente com o Telegram.
- O Binc é control plane e terminal administrativo, não uma segunda implementação do bot.
- Toda mensagem possui `workspace_id`, `tenant_id` quando aplicável, origem, destino, timestamp e correlação.
- Toda campanha/post identificado deve carregar `project_id` e `campaign_id` canônicos.
- Envio externo, mídia, publicação, exclusão e alteração sensível exigem confirmação explícita.
- O `actor_id` é derivado da sessão server-side; nunca aceito do cliente.
- O terminal só mostra usuários e telefones conforme a permissão do administrador, com mascaramento por padrão.
- Anexos ficam em armazenamento privado, com validação MIME, tamanho, extensão e retenção.
- Eventos são idempotentes por `event_id` ou chave equivalente do canal.
- Falhas de upstream aparecem como estado explícito; o produto não inventa entrega.

## 5. Usuários e permissões

### Global admin

Pode consultar todos os workspaces autorizados, abrir conversas, ver contexto de campanha e enviar mensagens/mídia após confirmação.

### Operador de tenant

Pode consultar apenas o tenant/workspace atribuído e enviar somente dentro desse escopo.

### Auditor

Pode consultar histórico e auditoria, sem enviar mensagens nem anexar mídia.

## 6. Experiência do terminal

### 6.1 Lista de conversas

- conversas recentes ordenadas por evento;
- filtros por estado: nova, em atendimento, aguardando usuário, encerrada, erro;
- busca por texto e identificador mascarado;
- badge de workspace, tenant e projeto;
- indicador de mensagem não lida;
- atualização por SSE/WebSocket ou polling server-side controlado, conforme a capacidade do gateway.

### 6.2 Linha do tempo

Cada evento mostra:

- direção: usuário → bot ou bot → usuário;
- autor/origem: usuário, Hermes automático ou administrador assistido;
- horário no fuso do workspace;
- texto e mídia com URL temporária;
- intenção classificada, quando disponível;
- `campaign_id`/post relacionado;
- resultado de entrega;
- evento de auditoria vinculado.

### 6.3 Contexto de campanha/post

Quando uma mensagem mencionar produto, campanha, publicação ou aprovação:

- mostrar candidatos encontrados;
- exibir confiança da identificação;
- permitir abrir a campanha oficial no projeto Instagram;
- nunca selecionar silenciosamente um post ambíguo para uma ação destrutiva;
- solicitar confirmação para vincular manualmente uma mensagem a uma campanha.

### 6.4 Composer

- texto;
- anexar imagem;
- pré-visualização e remoção do anexo;
- confirmação antes do envio;
- aviso claro: “mensagem enviada pelo terminal administrativo através do Hermes”;
- estado de envio, sucesso, falha e retry idempotente;
- bloqueio para auditor e escopos sem permissão.

## 7. Contrato de integração

O contrato entre Hermes Gateway, Binc e Instagram deverá ser versionado e incluir, no mínimo:

```json
{
  "event_id": "string",
  "occurred_at": "ISO-8601",
  "channel": "telegram",
  "direction": "inbound|outbound",
  "actor_type": "user|hermes|admin_assisted",
  "workspace_id": "string",
  "tenant_id": "string|null",
  "project_id": "string|null",
  "conversation_id": "string",
  "external_user_ref": "string",
  "message_type": "text|image|document|system",
  "text": "string|null",
  "media_ref": "string|null",
  "campaign_id": "string|null",
  "intent": "string|null",
  "delivery_status": "received|queued|sent|failed|unknown",
  "correlation_id": "string"
}
```

O `external_user_ref` não deve ser exibido integralmente por padrão. O token e credenciais ficam exclusivamente server-side.

## 8. Refinamento do prompt mestre

Usar este prompt como contrato de execução para as próximas sprints:

```text
Você é o arquiteto e agente construtor do Binc Orchestrator, operado pelo Hermes Agent.

MISSÃO
Evoluir o Binc como control plane administrativo multi-projeto. O Binc deve corrigir o dashboard, monitorar os projetos e oferecer um terminal administrativo para acompanhar e, com confirmação explícita, responder usuários através do Hermes Gateway.

FRONTEIRAS
1. InstagramAutomationPostHermes continua sendo o repositório exclusivo de campanhas, prompts, mídia, aprovação, publicação e Insights do Instagram.
2. CofrinIA Finance continua sendo o único domínio financeiro oficial e permanece no repositório próprio, integrado apenas pelo bridge oficial.
3. O Binc não cria um segundo bot, não faz polling do Telegram e não duplica dados de domínio.
4. O Hermes Gateway é o único processo que conversa diretamente com o Telegram.

TERMINAL ADMINISTRATIVO
Implementar uma visão de conversas com eventos inbound/outbound, usuário mascarado, workspace, tenant, projeto, intenção, campanha/post associado, mídia e estado de entrega. O administrador global pode enviar texto ou imagem pelo terminal após confirmação explícita. Toda ação deve ser server-side, RBAC, workspace-scoped, idempotente e auditada.

IDENTIFICAÇÃO DE POST
Nunca vincule uma mensagem ambígua a um post silenciosamente. Apresente candidatos, confiança e campaign_id. Ações de aprovação, publicação, exclusão, envio ou alteração exigem confirmação inequívoca.

INTERFACE
Todo botão deve ter rota, handler testado ou estado desabilitado com explicação. Não criar botões decorativos. Verificar navegação lateral, busca, notificações, perfil, projetos, agenda, histórico, onboarding e relatórios.

SEGURANÇA
Não imprimir nem commitar tokens, senhas, telefones completos ou connection strings. Nunca aceitar actor_id do cliente. Não expor segredos ao navegador. Validar MIME, tamanho e retenção de anexos. Registrar auditoria com resultado real. Mensagens financeiras e publicações continuam sujeitas às regras próprias e confirmação explícita.

METODOLOGIA
Para cada correção: reproduzir, escrever teste, observar RED, implementar o mínimo, observar GREEN, refatorar e executar a suíte completa. Trabalhar em commits pequenos. Não declarar sprint concluída sem validação local, na VM quando aplicável e leitura de estado externo.

ENTREGÁVEIS
Código, testes, documentação, contrato de eventos, critérios de aceite, riscos, status de deploy e commit. Se uma integração externa estiver indisponível, registrar o bloqueio sem inventar sucesso.
```

## 9. Sprints propostas

### Sprint 12 — Confiabilidade do dashboard

**Objetivo:** eliminar botões decorativos e navegação sem destino.

Entregas:

- rota/catálogo de projetos para `Ver todos`;
- agenda/jobs para `Ver agenda`;
- histórico/auditoria para `Abrir histórico`;
- destinos reais para Tarefas, Instagram e Documentação;
- estados funcionais para busca, notificações e perfil;
- Novo workspace com fluxo ou estado explicitamente bloqueado por falta de contrato;
- teste de navegação e acessibilidade básica.

Aceite:

- nenhum botão primário sem ação ou motivo visível;
- cada link abre uma rota válida ou seção existente;
- falhas do control plane mostram erro recuperável;
- lint, build e testes passam.

### Sprint 13 — Contrato de eventos e ingestão

**Objetivo:** registrar o que usuário e bot trocam sem polling duplicado.

Entregas:

- schema versionado de eventos;
- endpoint interno autenticado para ingestão do Hermes Gateway;
- armazenamento inicial append-only com idempotência;
- correlação por conversa, usuário mascarado, workspace, tenant e projeto;
- retenção e redaction de dados sensíveis;
- testes de duplicidade, escopo e autorização.

Aceite:

- evento repetido não cria mensagem duplicada;
- evento de outro workspace não aparece no workspace atual;
- token nunca chega ao frontend;
- auditoria registra ingestão e falhas.

### Sprint 14 — Terminal somente leitura

**Objetivo:** acompanhar conversas e identificar posts solicitados.

Entregas:

- lista, filtros e busca de conversas;
- timeline de mensagens;
- contexto de campanha/post com candidatos e confiança;
- filtros por projeto e tenant;
- atualizações controladas e estados vazios;
- testes de autorização e identificação ambígua.

Aceite:

- administrador encontra uma conversa por identificador mascarado ou texto;
- campanha relacionada aparece com `campaign_id` real;
- mensagem ambígua não dispara ação automática;
- auditor consegue ler, mas não enviar.

### Sprint 15 — Composer de texto e mídia

**Objetivo:** permitir resposta administrativa através do Hermes, com confirmação.

Entregas:

- envio de texto;
- upload e envio de imagem privada;
- pré-visualização, validação e retenção;
- confirmação explícita;
- estados queued/sent/failed/unknown;
- retry idempotente;
- auditoria com actor server-side.

Aceite:

- nenhuma mensagem sai sem confirmação;
- sucesso só é exibido após resposta real do gateway;
- falha não é apresentada como enviada;
- anexos inválidos são rejeitados antes do upstream.

### Sprint 16 — Hardening, operação e publicação controlada

**Objetivo:** tornar o terminal apto para operação real.

Entregas:

- RBAC completo;
- rate limit e proteção contra abuso;
- métricas e alertas;
- runbook de incidentes;
- testes end-to-end na VM;
- revisão independente de segurança;
- deploy controlado e rollback documentado.

Aceite:

- threat model aprovado;
- auditoria íntegra;
- testes locais e de integração aprovados;
- deploy verificado por leitura real do serviço;
- nenhuma credencial ou dado sensível exposto.

## 10. Riscos e decisões pendentes

- Definir se o canal operacional inicial é Telegram apenas ou se o bridge também encaminhará WhatsApp.
- Definir transporte de eventos: webhook interno assinado, fila ou SSE intermediário.
- Definir retenção de texto e mídia, incluindo LGPD e exclusão solicitada.
- Confirmar API disponível no Hermes Gateway para envio de texto/imagem.
- Confirmar estratégia de persistência: JSONL append-only temporário ou PostgreSQL.
- Não iniciar envio real antes de validar confirmação, RBAC, auditoria e idempotência.

## 11. Métricas de sucesso

- 100% dos botões do dashboard com comportamento verificável.
- 0 eventos duplicados após retry do gateway.
- 100% das ações administrativas com auditoria e resultado.
- 0 segredos no navegador, logs ou repositórios.
- tempo de identificação de campanha inferior a 5 segundos em consultas indexadas.
- taxa de falha de envio visível e reconciliável, sem falsos sucessos.
