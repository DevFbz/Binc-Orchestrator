# Auditoria funcional do dashboard Binc Orchestrator

**Data:** 2026-09-12
**Escopo:** dashboard Next.js, navegação lateral, botões da visão geral e integração administrativa com Instagram/Hermes.

## Resumo

A inspeção do código e dos fluxos atuais encontrou controles visuais sem ação associada. O problema não é apenas visual: os elementos comunicam uma capacidade que ainda não existe.

## Achados

### QA-001 — `Ver todos` não executa ação

- **Local:** visão geral, painel “Seus projetos”.
- **Evidência:** `src/app/page.tsx`, botão `.textButton` sem `onClick`, `href` ou rota.
- **Esperado:** abrir catálogo de projetos ou uma visão filtrada de todos os projetos.
- **Atual:** nenhum efeito.
- **Severidade:** média.
- **Correção planejada:** Sprint 12, rota `/projects` ou drawer com catálogo completo.

### QA-002 — `Ver agenda` não executa ação

- **Local:** visão geral, painel “Próximas automações”.
- **Evidência:** botão sem handler ou destino.
- **Esperado:** abrir `/jobs` ou agenda operacional filtrada.
- **Atual:** nenhum efeito.
- **Severidade:** média.
- **Correção planejada:** Sprint 12.

### QA-003 — `Abrir histórico` não executa ação

- **Local:** visão geral, painel “Atividade recente”.
- **Evidência:** botão sem handler ou destino.
- **Esperado:** abrir auditoria/histórico com filtros por projeto, workspace e período.
- **Atual:** nenhum efeito.
- **Severidade:** média.
- **Correção planejada:** Sprint 12.

### QA-004 — Controles do cabeçalho não têm fluxo

- **Local:** busca, notificações e perfil.
- **Evidência:** botões renderizados sem handlers.
- **Esperado:** busca global segura, central de notificações e menu de sessão/perfil.
- **Atual:** nenhum efeito.
- **Severidade:** média.
- **Correção planejada:** Sprint 12, com escopo mínimo e estados vazios honestos.

### QA-005 — Navegação lateral usa âncoras inexistentes ou incompletas

- `Tarefas` aponta para `#tasks`, mas não há seção correspondente na página.
- `Instagram` aponta para `#instagram`, mas não há seção correspondente na página.
- `Documentação` aponta para `#docs`, mas não há seção correspondente na página.
- `CofrinIA Finance` abre o repositório externo, conforme a decisão arquitetural; não deve virar módulo financeiro duplicado.
- **Severidade:** média.
- **Correção planejada:** Sprint 12: criar destinos reais ou substituir por links desabilitados com explicação.

### QA-006 — `Novo workspace` é apenas apresentação

- **Local:** `/onboarding`.
- **Evidência:** botão sem `onClick`.
- **Esperado:** iniciar fluxo de criação protegido por RBAC e confirmação.
- **Atual:** nenhum efeito.
- **Severidade:** alta para governança, pois aparenta permitir uma operação administrativa inexistente.
- **Correção planejada:** Sprint 12/16, somente depois de definir contrato de criação e auditoria.

### QA-007 — Exportação de relatório ainda não está implementada

- **Local:** `/reports`, botão “Exportar depois”.
- **Evidência:** botão sem handler e texto indica explicitamente etapa futura.
- **Esperado:** exportação assíncrona com período, fontes e limitações declarados.
- **Atual:** nenhum efeito.
- **Severidade:** baixa/média.
- **Correção planejada:** sprint posterior de relatórios exportáveis.

## Lacuna arquitetural para o terminal administrativo

O Binc atualmente consulta campanhas pelo control plane, mas não possui:

- armazenamento de mensagens recebidas/enviadas do bot;
- stream de eventos em tempo real;
- associação confiável entre mensagem, usuário, workspace, tenant, campanha e post;
- endpoint de composição e envio de texto/imagem;
- upload server-side de anexos;
- confirmação forte e auditoria para mensagens enviadas pelo administrador;
- visualização de histórico de conversa.

O Hermes Gateway deve continuar sendo o único processo responsável pelo polling do Telegram. O terminal do Binc deve consumir eventos por um contrato interno, não fazer polling paralelo nem acessar tokens do Telegram no navegador.

## Critérios para encerrar a auditoria

- Cada botão possui rota, handler funcional ou estado desabilitado explicitamente explicado.
- Testes automatizados cobrem navegação e estados de erro.
- O terminal exibe mensagens reais com indicação de origem, horário, usuário, workspace e projeto.
- Envio de texto e mídia exige confirmação explícita, registra auditoria e permite rastrear o resultado.
- Nenhum token aparece no frontend, logs, PRD ou respostas do Telegram.
