## O que muda?

<!-- Descreva o que este PR faz em 1-3 frases -->

## Checklist de Qualidade

- [ ] JSDoc em todos os metodos publicos novos/modificados
- [ ] Toasts via `messages.ts` (nenhum hardcoded)
- [ ] `tryCatch()` + `toast.error()` nos hooks (sem `console.error`)
- [ ] aria-labels em componentes interativos novos
- [ ] Paginacao em queries de listagem (`.range()` ou `.limit()`)
- [ ] Testes para logica nova (services, hooks, libs)
- [ ] `events.emit()` em operacoes de escrita (create/update/delete)
- [ ] Endpoints backend com `require_scope()`
- [ ] `npm run build` passa (0 erros)
- [ ] `npm run test` passa (48+ testes)
- [ ] `npm run lint` sem erros novos
