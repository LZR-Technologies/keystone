# Runbook: [Nome do Serviço]

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **Serviço** | Nome |
| **Repo** | github.com/LZR-Tech/... |
| **Stack** | TypeScript / Node / Next.js |
| **Ambiente** | Production: URL / Staging: URL |
| **Owner** | @time-responsavel |
| **Dashboard** | Link para dashboard de observabilidade |
| **Alertas** | Link para configuração de alertas |

## Como subir localmente

```bash
# 1. Clone o repo
git clone https://github.com/LZR-Tech/NOME.git

# 2. Copie as env vars
cp .env.example .env.local

# 3. Instale dependências
npm install

# 4. Suba o banco local (se aplicável)
npx supabase start

# 5. Rode o dev server
npm run dev
```

## Como fazer deploy

```bash
# Deploy automático via merge na main
# Manual (se necessário):
npm run build
npm run deploy
```

## Como fazer rollback

```bash
# Opção 1: Revert do commit
git revert HEAD
git push origin main

# Opção 2: Deploy da versão anterior
# (descrever processo específico)
```

## Como rotacionar secrets

1. Gere o novo secret no provedor
2. Atualize no vault/env vars do ambiente
3. Faça deploy para aplicar
4. Revogue o secret antigo
5. Valide que o serviço está funcionando

## Como restaurar backup

1. Acesse o painel do Supabase
2. Vá em Database > Backups
3. Selecione o backup desejado
4. Confirme a restauração

**RTO:** [tempo máximo para restaurar]
**RPO:** [perda máxima de dados aceitável]

## Resposta a Incidentes

### SEV-1 — Outage Completo
1. Notificar time imediatamente
2. Verificar status dos serviços externos
3. Checar logs: `[link para logs]`
4. Se necessário, fazer rollback
5. Comunicar stakeholders
6. Postmortem em até 48h

### SEV-2 — Degradação Crítica
1. Verificar dashboards e métricas
2. Identificar componente afetado
3. Aplicar fix ou rollback
4. Resposta em <30 minutos

### SEV-3 — Issue Não-Crítico
1. Criar issue no GitHub
2. Priorizar no próximo sprint
3. Resposta em <4 horas

### SEV-4 — Inconveniência Menor
1. Criar issue no GitHub
2. Resolver no próximo dia útil

## Contatos

| Papel | Contato |
|-------|---------|
| **On-call** | @pessoa |
| **Tech Lead** | @pessoa |
| **Product** | @pessoa |

---

> Ref: [LZR Engineering Handbook — SRE & Confiabilidade](https://code.lzrtechnologies.com)
