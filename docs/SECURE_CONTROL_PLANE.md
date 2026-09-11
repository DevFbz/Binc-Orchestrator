# Control Plane seguro — Vercel ↔ Azure

## Objetivo

Permitir que o frontend Next.js na Vercel consulte o Hermes/Instagram Studio na VM Azure sem expor credenciais no navegador.

```text
Browser
  ↓ HTTPS
Vercel /api/control-plane
  ↓ Authorization: Bearer (server-side)
HTTPS control plane na Azure
  ↓ loopback/internal
Instagram Studio + Hermes
```

## Variáveis necessárias

### Azure VM

Adicionar ao ambiente seguro do serviço do Instagram Studio:

```text
CONTROL_PLANE_TOKEN=<mesmo segredo longo e aleatório usado na Vercel>
```

Não colocar esse valor no GitHub, Notion, frontend ou chat.

### Vercel

No projeto `web-platform`, configurar como variável **Server-side** para Production:

```text
HERMES_CONTROL_PLANE_URL=https://control-plane.seu-dominio.com
HERMES_CONTROL_PLANE_TOKEN=<mesmo segredo da Azure>
```

Não usar `NEXT_PUBLIC_`.

## Endpoint atual de integração

A integração funcional atual usa um Cloudflare Quick Tunnel com HTTPS válido. Ele é adequado para validar a comunicação Vercel ↔ Azure, mas a URL pode mudar se o túnel for recriado.

Para produção definitiva, substituir por um domínio próprio ou túnel nomeado persistente.

## Requisitos HTTPS

O endpoint da Azure precisa ter:

- domínio ou subdomínio próprio;
- certificado TLS válido;
- reverse proxy (Caddy/Nginx) ou gateway equivalente;
- firewall permitindo somente 443;
- autenticação Bearer validada pelo backend;
- encaminhamento para `127.0.0.1:8787`;
- endpoint `/api/health` para monitoramento;
- rate limit e logs sem token.

Não publicar o serviço usando HTTP simples ou IP sem TLS.

## Validação

Após configurar o domínio e as duas variáveis:

```bash
curl -i https://control-plane.seu-dominio.com/api/health
```

A Vercel deve responder:

```text
GET /api/control-plane → 200
```

Quando a variável estiver ausente:

```text
503 control_plane_not_configured
```

Quando o domínio estiver inacessível:

```text
502 control_plane_unavailable
```

Quando o token estiver incorreto:

```text
502 com origem HTTP 401
```

Nenhum desses estados deve ser mascarado por dados fictícios.

## Rotação

1. Gerar novo segredo fora do código.
2. Atualizar Azure.
3. Reiniciar somente o serviço do Instagram Studio.
4. Atualizar Vercel.
5. Fazer novo deploy.
6. Validar `/api/control-plane`.
7. Revogar o segredo antigo.

## Limite de escopo

Esse token protege a comunicação entre Vercel e Azure. Ele não substitui:

- login da plataforma web;
- RBAC por usuário;
- allowlist do Telegram;
- permissões da Meta;
- auditoria por ação.
