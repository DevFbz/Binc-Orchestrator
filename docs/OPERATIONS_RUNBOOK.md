# Runbook operacional — Binc Orchestrator

## Arquitetura

```text
Vercel Binc
  -> HTTPS Quick Tunnel
  -> Binc Control Plane 127.0.0.1:8791
  -> Instagram Studio 127.0.0.1:8787
  -> CofrinIA Bridge 127.0.0.1:8790
```

O Hermes Gateway é o único processo que conversa diretamente com o Telegram.

## Verificação sem expor segredos

Na VM Azure:

```bash
systemctl --user is-active binc-control-plane.service
systemctl --user is-active instagram-studio.service
systemctl --user is-active cofrinia-hermes-bridge.service
systemctl --user is-active cloudflared-control-plane.service
systemctl --user is-active instagram-preflight.timer
```

Não executar `cat` ou `printenv` para inspecionar credenciais. O ambiente secreto fica em:

```text
/home/hermes/.hermes/.env
/home/hermes/apps/cofrinia-hermes-bridge/.env
```

## Smoke test público

No computador, a partir da raiz do Binc:

```bash
python deploy/smoke_test.py
```

O teste verifica páginas, API, headers e o bloqueio de envio sem confirmação. Ele nunca envia uma mensagem válida.

## Incidente do Binc

1. Executar o smoke test.
2. Verificar `binc-control-plane.service`.
3. Consultar logs sem variáveis de ambiente:

```bash
journalctl --user -u binc-control-plane.service -n 100 --no-pager
```

4. Se o Binc estiver parado, reiniciar somente o serviço Binc:

```bash
systemctl --user restart binc-control-plane.service
```

5. Reexecutar health e smoke test.
6. Se o erro for do túnel, verificar:

```bash
systemctl --user status cloudflared-control-plane.service --no-pager
journalctl --user -u cloudflared-control-plane.service -n 80 --no-pager
```

Não substituir o túnel por HTTP público sem TLS.

## Incidente do Hermes Gateway

O gateway deve ser reiniciado a partir de uma sessão SSH externa, nunca como processo filho do próprio gateway:

```bash
hermes gateway status
hermes gateway restart
```

Após o restart, validar uma mensagem autorizada e consultar o terminal Binc. Não considerar entrega comprovada apenas pela aceitação HTTP: conferir o status real do evento.

## Rollback

### Vercel

1. Listar deployments e identificar a última versão `READY` conhecida:

```bash
vercel ls binc-orchestrator
vercel inspect <deployment-url>
```

2. Promover a versão estável conforme o fluxo de rollback do projeto/Vercel.
3. Reexecutar:

```bash
python deploy/smoke_test.py
```

Nunca apagar uma versão estável antes de validar a substituta.

### VM

Os serviços são atualizados por cópia controlada dos arquivos do repositório. Antes de substituir arquivos críticos:

```bash
cp /home/hermes/apps/binc-orchestrator/backend/control_plane_server.py /home/hermes/apps/binc-orchestrator/backend/control_plane_server.py.bak
```

Depois da cópia:

```bash
cd /home/hermes/apps/binc-orchestrator
PYTHONPATH=backend python3 -m py_compile backend/*.py
systemctl --user restart binc-control-plane.service
```

Se a validação falhar, restaurar o `.bak`, recompilar e reiniciar o serviço. Não restaurar `.env` a partir do Git.

## Dados e auditoria

- `data/audit.jsonl` é append-only.
- `data/events/telegram.jsonl` é append-only e idempotente por `event_id`.
- `data/outbox/telegram-admin.jsonl` registra mensagens administrativas.
- `data/private-media/` é temporário e deve ficar vazio após envio confirmado.

Não editar esses arquivos manualmente para ocultar uma falha. Registrar a correção como evento/commit.

## Critérios de sucesso

```text
✅ serviços necessários ativos
✅ páginas públicas retornando 200
✅ control plane retornando 200
✅ headers de segurança presentes
✅ confirmação sem envio retornando 400
✅ falhas exibidas como falhas
✅ nenhum segredo em logs, GitHub ou frontend
✅ working tree e commit remoto verificados
```
