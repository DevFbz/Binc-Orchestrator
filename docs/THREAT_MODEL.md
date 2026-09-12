# Threat model — Binc Orchestrator

## Escopo

Este modelo cobre o Binc Orchestrator, o control plane na VM Azure, o dashboard Vercel, o Hermes Gateway, o Instagram Studio e o bridge do CofrinIA.

## Ativos protegidos

```text
credenciais Telegram, Meta, Azure, Vercel e CofrinIA
mensagens e identificadores de usuários
campanhas e mídia Instagram
lançamentos financeiros
logs de auditoria
estado dos jobs
```

## Fronteiras de confiança

```text
navegador
  → BFF server-side Vercel
  → HTTPS/Quick Tunnel
  → Binc Control Plane localhost
  → serviços de domínio localhost
```

O navegador não recebe tokens do control plane. O Hermes Gateway é o único processo que conversa diretamente com o Telegram.

## Ameaças e controles

| Ameaça | Controle | Estado |
|---|---|---|
| Token exposto no navegador | variáveis server-side e BFF | implementado |
| Token versionado no Git | `.gitignore`, revisão e arquivos sem segredos | implementado |
| Acesso sem autenticação ao control plane | Bearer Token e 401 | implementado |
| Requisições mutantes em excesso | rate limit por cliente | implementado |
| Reenvio duplicado | idempotency key e outbox | implementado |
| Envio sem confirmação | `confirm=true` obrigatório | implementado |
| Falso sucesso de entrega | status real `sent/failed/unknown` | implementado |
| Arquivo malicioso | MIME, extensão, assinatura e tamanho | implementado |
| Retenção indevida de mídia | remoção após envio confirmado | implementado |
| Vazamento de telefone | mascaramento no terminal | implementado |
| Cruzamento entre tenants | workspace/tenant/project scope | implementado |
| Evento Telegram duplicado | `event_id` idempotente | implementado |
| Auditoria apagada | JSONL append-only | implementado |
| Serviço indisponível | health check e métricas | implementado |
| Quick Tunnel mudar de hostname | runbook e futura migração para túnel nomeado | risco residual |
| Rate limit não compartilhado entre réplicas | implementação em memória | risco residual |
| Credencial administrativa fraca | autenticação web server-side configurável | requer configuração |
| Falha do upstream Hermes | status unknown e reconciliação manual | risco residual |

## Casos de abuso prioritários

### Usuário tentando enviar para outro workspace

O servidor obtém o destinatário a partir de uma conversa já persistida no escopo Instagram. O cliente não fornece `external_user_ref` como destino livre.

### Mensagem sem confirmação

O endpoint rejeita a operação com HTTP 400 antes de chamar `hermes send`.

### Repetição de uma imagem

A mesma `idempotency_key` não repete envio confirmado ou de estado desconhecido.

### Falha do Hermes

O Binc registra `failed` ou `unknown`, não exibe sucesso e mantém auditoria para reconciliação.

### Upload perigoso

Arquivos fora de JPEG/PNG/WebP, com MIME incompatível, assinatura inválida ou maiores que 5 MiB são rejeitados antes do upstream.

## Dados que não devem aparecer em logs/respostas

```text
tokens
senhas
connection strings
conteúdo de .env
telefone completo
base64 de anexos
caminho interno de mídia
```

## Critérios de aprovação

```text
✅ E2E local dos três serviços
✅ rotas protegidas retornam 401 sem credencial
✅ health retorna 200
✅ envio sem confirmação retorna 400
✅ envio validado gera auditoria
✅ mídia enviada é removida após sucesso
✅ nenhuma credencial no repositório
✅ smoke test público PASS
```

## Riscos residuais aceitos temporariamente

1. Quick Tunnel é temporário; migrar para Cloudflare Tunnel nomeado antes de operação permanente.
2. Rate limit em memória serve à instância única atual; migrar para Redis ao escalar horizontalmente.
3. Autenticação web só deve ser habilitada após configurar credenciais fortes na Vercel.
