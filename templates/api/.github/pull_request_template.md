## O que muda?

<!-- Descreva o que este PR faz em 1-3 frases -->

## Checklist de Qualidade (Engineering Handbook v2.2)

### Código
- [ ] JSDoc em todos os métodos públicos novos/modificados
- [ ] Comentários explicativos em decisões não óbvias (trade-offs, workarounds, regras de negócio)
- [ ] Result Pattern (`ok` / `fail`) em vez de throw para erros de negócio
- [ ] Zod validando toda entrada externa (body, params, headers, env vars)
- [ ] Logging estruturado via Pino (sem `console.*`)
- [ ] Zero `any` — usar `unknown` + type guard
- [ ] Named exports (sem `default`)
- [ ] Paginação em queries de listagem (`.limit()` ou cursor)
- [ ] Erros HTTP seguindo RFC 9457 (Problem Details)
- [ ] Testes para lógica nova (services, controllers, utils)

### Validação
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` sem erros novos
- [ ] `npm run test` passa
- [ ] `npm run build` passa
- [ ] Cobertura de testes ≥ 80% nas features novas

### Segurança
- [ ] Nunca logar senhas, tokens, CPF/CNPJ, dados de cartão
- [ ] Variáveis sensíveis em `.env.local` (não em `.env`)
- [ ] Endpoints protegidos validam scope/auth

## Referências

- [Engineering Handbook](https://code.lzrtechnologies.com)
