# Binc Orchestrator

Painel administrativo e control plane multi-projeto do Hermes Agent.

## Responsabilidade

Este repositório contém a plataforma de administração:

- dashboard Next.js para Vercel;
- control plane de projetos;
- integração com o CofrinIA Finance pelo bridge oficial;
- proxy autenticado para o projeto Instagram;
- relatórios, tarefas, jobs e documentação futura;
- prospecção local de empresas por nicho, estado e cidade;
- terminal administrativo de conversas, planejado em `docs/PRD_ADMIN_TERMINAL.md`.

## Repositórios separados

### InstagramAutomationPostHermes

Contém exclusivamente a automação de conteúdo Instagram:

- campanhas;
- calendário editorial Instagram;
- aprovação Telegram;
- geração de arte;
- publicação Feed;
- pacote Story;
- Azure Blob de mídias;
- Insights Instagram.

### Binc Orchestrator

Contém a administração global:

- projetos;
- tenants/workspaces;
- painel web;
- finanças;
- relatórios;
- jobs;
- permissões;
- auditoria;
- integração com módulos.

## Desenvolvimento local

```bash
npm install
npm run dev
# http://localhost:3000
```

Backend control plane:

```bash
PYTHONPATH=backend python backend/control_plane_server.py
# porta local 8790
```

Variáveis server-side:

```text
HERMES_CONTROL_PLANE_URL=https://endpoint-seguro
HERMES_CONTROL_PLANE_TOKEN=segredo-server-side
GOOGLE_PLACES_API_KEY=chave-server-side-do-google-places
```

Nunca use `NEXT_PUBLIC_` para essas variáveis.

### Localizador de empresas

O módulo **Prospecção** usa o Google Places API (New) no control plane para consultar empresas por nicho, estado e cidade. A chave deve ficar somente no ambiente do backend, com as APIs necessárias habilitadas e restrição por servidor/uso.

O resultado inclui apenas dados públicos retornados pela fonte — nome, endereço, telefone comercial, site, Maps e status quando disponíveis — e remove duplicados entre páginas. A interface prepara uma mensagem de abordagem, mas não envia mensagens automaticamente. CNPJ não é inferido porque não é fornecido por essa consulta.

## Vercel

Configure a raiz do projeto Vercel como a raiz deste repositório, onde estão `package.json` e `src/`.

O frontend não deve acessar tokens ou serviços internos diretamente. Use `/api/control-plane` como proxy server-side.

## Testes

```bash
npm run lint
npm run build
PYTHONPATH=backend uv run --with pytest pytest tests -q
```

## Segurança

- nenhum segredo no GitHub;
- nenhum token no frontend;
- todo endpoint administrativo exige Bearer Token;
- finanças ficam no workspace privado;
- ações destrutivas exigem confirmação via Hermes;
- dados Instagram e financeiros permanecem separados;
- auditoria deve ser append-only.

## Status

O dashboard Next.js está publicado na Vercel. O control plane Python cataloga Instagram Content Operations e CofrinIA Finance, monitora jobs e expõe somente integrações administrativas. O domínio financeiro oficial permanece no repositório do CofrinIA.
