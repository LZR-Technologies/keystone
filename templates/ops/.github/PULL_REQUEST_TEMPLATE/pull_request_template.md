## O que muda?

<!-- Descreva o que este PR faz em 1-3 frases -->

## Checklist de Qualidade (Engineering Handbook v2.2)

### Código
- [ ] JSDoc em todos os metodos publicos novos/modificados
- [ ] Comentarios explicativos em decisoes nao obvias (trade-offs, workarounds, regras de negocio)
- [ ] `tryCatch()` + `toast.error()` nos hooks (sem `console.error`)
- [ ] aria-labels em componentes interativos novos
- [ ] Paginacao em queries de listagem (`.range()` ou `.limit()`)
- [ ] Testes para logica nova (services, hooks, libs)
- [ ] `events.emit()` em operacoes de escrita (create/update/delete)
- [ ] Endpoints backend com `require_scope()`

### Design System (v1.3)
- [ ] Tokens do DS usados (sem cores Tailwind hardcoded: `bg-emerald-600`, `text-blue-500`)
- [ ] Sem prefixo `dark:` (CSS variables mudam automaticamente)
- [ ] Toasts com Lucide icons (sem emojis)
- [ ] Componentes de `@/components/ui/` (sem tags HTML diretas)

### Data Fetching
- [ ] React Query para server data (sem `useState` + `useEffect` para fetch)
- [ ] Query keys registradas em `query-keys.ts`
- [ ] Mutations com `onMutate` otimista + `onError` rollback

### Navegacao
- [ ] Botoes de retroceder usam `router.back()` (nunca `router.push('/rota-fixa')`)

### Validacao
- [ ] `npm run design:audit` passa (0 errors)
- [ ] `npm run build` passa (0 erros)
- [ ] `npm run test` passa (90+ testes)
- [ ] `npm run lint` sem erros novos
