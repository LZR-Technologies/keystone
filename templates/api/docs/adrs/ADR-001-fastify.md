# ADR-001: Fastify como framework HTTP

**Status:** Aceita
**Data:** 2026-03-27
**Autor(es):** LZR Technologies

## Contexto

Precisamos de um framework HTTP performante para APIs TypeScript/Node.

## Opções Consideradas

### Express
- **Prós:** Ecossistema maduro, muito material
- **Contras:** Performance inferior, tipagem fraca, middleware legacy

### Fastify
- **Prós:** Alta performance, TypeScript first, schema validation nativa, logging integrado (pino)
- **Contras:** Ecossistema menor que Express

### Hono
- **Prós:** Ultra-leve, multi-runtime
- **Contras:** Ecossistema ainda jovem

## Decisão

**Fastify** — melhor balanço entre performance, tipagem e maturidade para APIs LZR.

## Impactos

- Todos os templates de API usam Fastify
- Logging via pino (já integrado)
- Schema validation via Zod (plugin disponível)
