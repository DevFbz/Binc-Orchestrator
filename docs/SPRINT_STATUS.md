# Status de Sprints — Implementação e Limites Externos

Atualizado em 2026-09-05.

## Sprints concluídas no código e na VM

- Sprint 0: infraestrutura Azure/Hermes/Telegram/Meta/Blob.
- Sprint 1: tenants, overview administrativo e calendário por tenant.
- Sprint 2: conteúdo `product`, `informative`, `marketing` e `holiday`.
- Sprint 3: parser Telegram estrito, auditoria e plugin de aprovação.
- Sprint 4: caminhos Blob por tenant/campanha, SAS no publicador, retenção e dry-run.
- Sprint 5: slots por tenant e recomendação de horários por Insights.
- Sprint 6: pacote Story 9:16 aprovado para publicação manual.
- Sprint 7: onboarding mínimo, RBAC e log JSONL append-only.

## Validações

```text
40+ testes locais passando durante a implementação
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

## Dependências externas não falsificadas como concluídas

- Cada novo cliente exige configuração própria e credenciais próprias.
- App Review/Advanced Access da Meta depende da análise da Meta.
- Stories permanecem em pacote aprovado/manual devido à limitação oficial do fluxo de Content Publishing.
- Insights reais só podem ser calculados depois de dados e permissões suficientes.
- Integração de uma conta Whimsical depende de sessão autenticada do usuário.

## Regra multi-tenant

Magú Moto Peças Filho é apenas o primeiro tenant. Nenhum módulo deve usar sua marca, catálogo, token ou calendário como padrão global quando houver um tenant explícito.
