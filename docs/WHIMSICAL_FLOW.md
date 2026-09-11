# Fluxograma completo para gerar no Whimsical AI

## Como usar

1. Abra o Whimsical e entre na conta autenticada.
2. Crie um novo board.
3. Abra o Whimsical AI.
4. Cole o prompt abaixo.
5. Gere um **flowchart de processo**, não apenas um mapa mental.
6. Depois revise os nomes dos tenants e mantenha Magú apenas como exemplo do primeiro cliente.

## Prompt para o Whimsical AI

```text
Crie um fluxograma profissional, completo e legível, em português do Brasil, para uma plataforma multi-tenant de automação segura de conteúdo no Instagram chamada "Instagram Automation Post Hermes".

Use orientação da esquerda para a direita, tema escuro, fundo grafite, detalhes laranja #FF6B35, azul para serviços externos, verde para sucesso, amarelo para revisão e vermelho para bloqueios. Use retângulos para serviços, losangos para decisões, cilindros para armazenamento e setas nomeadas. Organize o diagrama em swimlanes horizontais.

SWIMLANE 1 — ADMINISTRADOR GLOBAL
- Cadastra e administra múltiplos tenants/clientes
- Configura catálogo, brand kit, fuso horário, agenda, Telegram, Instagram e permissões de cada tenant
- Pode visualizar a consolidação global, mas os dados internos devem continuar isolados por tenant
- Magú Moto Peças Filho aparece apenas como Tenant 001 / primeiro cliente, não como cliente único

SWIMLANE 2 — TENANT / CLIENTE
- Possui tenant_id exclusivo
- Possui catálogo próprio
- Possui logo, cores, fontes, tom de voz e CTA próprios
- Possui calendário próprio e eventos personalizados
- Possui aprovadores Telegram próprios
- Possui conta Instagram Business e credenciais próprias
- Possui prefixo próprio no Azure Blob: TENANT_ID/CAMPAIGN_ID/HASH.jpg

SWIMLANE 3 — PAINEL WEB
- Selecionar tenant
- Consultar catálogo
- Consultar calendário editorial
- Criar campanha
- Visualizar legenda, prompt, fontes, imagem e status
- Visualizar histórico, auditoria, falhas, publicações e métricas
- Filtrar campanhas por tenant, tipo e status

SWIMLANE 4 — HERMES AGENT NA AZURE VM
- Hermes Gateway é o único processo que conversa com o Telegram
- Carrega somente configuração do tenant selecionado
- Escolhe tipo de conteúdo: Produto, Informativo, Marketing ou Data Comemorativa
- Produto: valida nome, preço e estoque disponível
- Informativo: exige fonte oficial e bloqueia alegações sem confirmação
- Marketing: usa CTA e identidade do tenant; não inventa desconto ou prazo
- Data comemorativa: aplica política marketing ou greeting_only
- Gera legenda, prompt de imagem, alt text e checklist de fatos
- Persiste campaign_id, tenant_id, content_type e status
- Cria auditoria de cada mudança
- Agenda cada tenant no próprio fuso e nos próprios slots

SWIMLANE 5 — TELEGRAM / APROVAÇÃO HUMANA
- Hermes envia campaign_id, tenant, legenda, prompt, fontes e instruções
- Losango: comando explícito de aprovação da legenda?
  - não: rejeitar, editar, solicitar nova versão ou cancelar
  - sim: estado WAITING_IMAGE
- Usuário envia imagem criada manualmente ou por gerador autorizado
- Losango: imagem pertence à campanha e ao tenant correto?
  - não: bloquear e solicitar reenvio
  - sim: validar e mudar para IMAGE_RECEIVED
- Revisão final mostra imagem, legenda, marca, preço, fontes e campanha
- Losango: "Aprovar e publicar" explicitamente?
  - não: rejeitar ou solicitar nova imagem
  - sim: estado APPROVED_FOR_SCHEDULE

SWIMLANE 6 — PUBLICADOR SEGURO
- Validar JPEG, tamanho, proporção, hash e conteúdo
- Confirmar tenant_id e campaign_id
- Usar Azure Managed Identity, nunca chave permanente do Storage
- Fazer upload para container privado instagram-approved
- Gerar SAS HTTPS temporário somente para leitura
- Criar media container na API oficial da Meta
- Losango: container processado e aprovação final válida?
  - não: retry controlado, FAILED ou EXPIRED
  - sim: executar media_publish somente após a confirmação dupla
- Registrar media_container_id, published_media_id, hash, horário e URL final
- Idempotência: o mesmo campaign_id/hash não pode gerar publicação duplicada

SWIMLANE 7 — STORY PACKAGE
- Gerar imagem 9:16, texto curto, logo e área segura
- Enviar pacote Story ao Telegram para aprovação
- Losango: API oficial da Meta suporta publicação Story no fluxo autorizado?
  - não: marcar STORY_MANUAL_PENDING e encaminhar para publicação manual
  - sim: usar somente endpoint oficial documentado e manter aprovação humana
- Registrar confirmação da publicação manual quando aplicável

SWIMLANE 8 — DADOS E OBSERVABILIDADE
- Azure Blob privado com prefixo por tenant
- JSON/SQLite/Postgres de campanhas e histórico
- Log append-only de auditoria
- Estados: DRAFT_CREATED, CAPTION_REVIEW, WAITING_IMAGE, IMAGE_RECEIVED, APPROVED_FOR_SCHEDULE, SCHEDULED, PUBLISHING, PUBLISHED, REJECTED, FAILED, EXPIRED, STORY_MANUAL_PENDING
- Retenção: rejeitados e expirados por período curto; publicados por retenção operacional limitada; auditoria por prazo maior
- Insights separados por tenant
- Recomendar melhores horários sem alterar agenda sem aprovação administrativa

REGRAS DE BLOQUEIO EM DESTAQUE
- Nunca publicar sem aprovação humana explícita
- Nunca aceitar "ok", emoji ou mensagem ambígua como aprovação
- Nunca misturar catálogo, token, marca, calendário, mídia ou histórico entre tenants
- Nunca colocar token, segredo ou chave no GitHub
- Nunca deixar Blob público permanentemente
- Nunca publicar Story por automação não oficial
- Nunca usar custo de aquisição ou estoque exato em material público
- Nunca inventar embalagem, especificação, desconto, prazo ou benefício técnico

Inclua uma legenda visual explicando: azul = serviço externo, verde = sucesso, amarelo = revisão humana, vermelho = bloqueio/erro, laranja = Hermes/orquestração, roxo = armazenamento e auditoria. Mostre claramente que o fluxo só chega a PUBLISHED depois de duas aprovações humanas: aprovação da legenda e aprovação final "Aprovar e publicar".
```

## Subfluxo resumido

```text
Tenant selecionado
→ catálogo/calendário/brand kit
→ brief editorial
→ legenda + prompt
→ aprovação da legenda
→ imagem
→ revisão final
→ aprovação explícita
→ Blob privado + SAS
→ media container Meta
→ media_publish
→ histórico + auditoria + Insights
```

## Nota sobre Stories

O diagrama deve mostrar Stories como `STORY_MANUAL_PENDING` quando a API oficial não oferecer publicação nesse fluxo. Não representar publicação automática por navegador, scraping ou método não oficial.
