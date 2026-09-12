---
name: binc-hermes-orchestrator-ops
description: Operar Instagram Automation e Binc Orchestrator pelo Hermes Telegram.
version: 1.0.0
---

# Binc Hermes Orchestrator — Operação Remota

## Objetivo

Esta skill orienta o Hermes Gateway quando o administrador estiver operando somente pelo Telegram. O Hermes é o orquestrador de dois projetos separados.

## Repositórios

### InstagramAutomationPostHermes

```text
https://github.com/DevFbz/InstagramAutomationPostHermes
```

Responsabilidade exclusiva:

- catálogo e tenants Instagram;
- campanhas;
- legendas e prompts;
- geração de arte;
- aprovação Telegram;
- publicação Feed;
- pacote Story manual;
- Azure Blob;
- scheduler de pré-revisão;
- histórico e Insights Instagram.

VM:

```text
/home/hermes/apps/instagram-studio
```

Serviço:

```text
instagram-studio.service
```

Porta local:

```text
127.0.0.1:8787
```

### Binc-Orchestrator

```text
https://github.com/DevFbz/Binc-Orchestrator
```

Responsabilidade:

- dashboard administrativo;
- projetos;
- workspaces e onboarding;
- RBAC;
- jobs;
- relatórios;
- saúde dos serviços;
- auditoria;
- módulo financeiro/pessoal;
- control plane.

VM:

```text
/home/hermes/apps/binc-orchestrator
```

Serviço:

```text
binc-control-plane.service
```

Porta local:

```text
127.0.0.1:8791
```

## Serviços ativos esperados

```bash
systemctl --user is-active hermes-gateway
systemctl --user is-active instagram-studio.service
systemctl --user is-active binc-control-plane.service
systemctl --user is-active instagram-preflight.timer
```

Não parar o Hermes Gateway para executar uma ação de projeto.

## Segurança obrigatória

- Nunca imprimir tokens, senhas ou valores de `.env`.
- Nunca colocar `.env`, tokens ou chaves em GitHub, mesmo em repositório privado.
- Nunca inserir segredos em Notion, relatórios, prompts ou mensagens Telegram.
- Segredos ficam somente em `/home/hermes/.hermes/.env`, com permissão `600`.
- Variáveis server-side da Vercel também não devem ser expostas ao navegador.
- Se um segredo for colado em uma conversa, recomendar rotação/revogação.
- Não executar publicação, exclusão ou movimentação financeira sem confirmação explícita.

## Fluxo de publicação Instagram

1. Identificar `tenant_id` e `campaign_id`.
2. Criar campanha no repositório Instagram.
3. Gerar legenda e prompt.
4. Enviar ao Telegram.
5. Aguardar `Aprovar legenda`.
6. Receber ou gerar imagem.
7. Apresentar revisão final.
8. Aguardar `Aprovar e publicar`.
9. Usar publicador seguro.
10. Registrar IDs e resultado.

Mensagens como `ok`, `pode ir`, emojis ou `manda` não aprovam.

## Fluxo financeiro

Workspace atual:

```text
personal
```

Toda movimentação deve ter:

- tipo `income` ou `expense`;
- valor em centavos;
- categoria;
- data;
- descrição;
- workspace_id.

Nunca criar lançamento sem confirmação explícita do usuário.

## Control plane

Rotas protegidas:

```text
GET /api/projects
GET /api/jobs
GET /api/tenants
GET /api/admin/overview
GET /api/reports/overview
GET /api/system/health
GET /api/audit/recent
GET /api/onboarding
GET /api/finance/summary
GET /api/finance/entries
POST /api/jobs/{job_id}/pause
POST /api/jobs/{job_id}/resume
POST /api/jobs/{job_id}/run
POST /api/finance/entries
```

O token do control plane é server-side e nunca deve ser respondido ao usuário.

## Jobs atuais

- `instagram-preflight-notification`: active, notifica uma hora antes do slot.
- `binc-control-plane-health`: active.
- `financial-reporting`: paused até haver configuração suficiente.

## Workspaces atuais

- `magu-moto-pecas-filho`: onboarding completo para Instagram.
- `personal`: módulo financeiro, integração ainda pendente.

Magú Moto Peças Filho é apenas o primeiro tenant. Nunca transformar sua marca em regra global.

## Sprints concluídas

- Sprint 0: fundação.
- Sprint 1: plataforma web e control plane.
- Sprint 2: projetos.
- Sprint 3: Instagram integrado.
- Sprint 4: financeiro inicial.
- Sprint 5: jobs e automações.
- Sprint 6: relatórios.
- Sprint 7: observabilidade e auditoria.
- Sprint 8: onboarding e RBAC.

## Próximas prioridades

1. Ativar autenticação web com `BINC_AUTH_ENABLED=true` após o administrador definir credenciais server-side.
2. Configurar integração financeira do workspace `personal`.
3. Persistir categorias, contas e recorrências financeiras.
4. Criar relatórios exportáveis.
5. Substituir Quick Tunnel por Cloudflare Tunnel nomeado ou domínio próprio.
6. Continuar operando e validando tudo pelo Telegram.

## Procedimento remoto

Quando o usuário perguntar pelo estado dos projetos:

1. consultar health;
2. consultar jobs;
3. consultar campanhas e publicações;
4. consultar onboarding;
5. consultar relatório executivo;
6. responder com resumo por projeto;
7. destacar erros e ações pendentes;
8. não inventar dados ausentes.

Quando o usuário pedir uma alteração:

1. identificar repositório correto;
2. verificar se a ação é leitura ou mutação;
3. pedir confirmação para ações sensíveis;
4. executar no diretório correto;
5. rodar testes;
6. registrar commit;
7. relatar resultado real.
