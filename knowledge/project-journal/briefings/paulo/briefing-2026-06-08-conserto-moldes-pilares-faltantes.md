# Briefing — Conserto do Keystone (moldes reais) + pilares faltantes

> **Origem:** sessão 2026-06-07/08 com Paulo (gigante, do escopo dos pilares até o conserto do Keystone).
> **Como usar:** ler no início da próxima sessão. Mapear o projeto antes de agir. Após absorver, apagar.
> **Status no fim:** o conserto grande está **FEITO e provado** — o Keystone gera projeto a partir dos
> moldes REAIS da LZR-Tech, autossuficientes. Próximo: cobrir os pilares que os moldes não cobrem,
> começando por **Segurança**.

## Resumo da sessão (o essencial)
Fechamos o desenho: 8 pilares, a alma (4 âncoras), nome **Keystone**, colaboração aberta, licença MIT.
Construí o Keystone em código (Node 24 + TypeScript, em `C:/lzr-technologies/keystone`). **MAS construí
uma CASCA** — gerava arquivos fracos inventados de cabeça em vez de usar os 7 templates reais da LZR-Tech.
Paulo cortou duramente (confiança quebrada — ver memory `nao-vender-casca-como-completo`).

Consertamos de verdade, **com prova a cada passo** (Paulo não lê código): trouxemos os 7 templates pra
dentro da skill byte a byte (diff = 0), religamos pra serem autossuficientes (configs via `file:` local
em vez de `github:LZR-Tech`), provamos rodando (capricho/tipos/testes verdes nos dois moldes web e api),
e o comando `new` agora **copia o molde real + troca só o nome** (provado: projeto = molde + 1 linha +
keystone.json). A casca foi apagada.

No fim, Paulo apontou (certeiro) que os 7 moldes **não cobrem os 8 pilares**.

## Branches / estado
- **keystone:** branch `feat/keystone-core`, ~14 commits, NÃO publicado. `npm run check` verde.
  Os moldes têm `node_modules` instalado (do teste) — ignorado pelo git.
- **lzr-core:** branch `feat/skill-new-project` — os docs de design dos pilares em `standards/plataforma/`.

## O que falta (em ordem)
1. **Cobrir os pilares faltantes** (ver memory `cobertura-pilares-moldes`): Banco e Colocar-no-ar inteiros;
   completar Fundação e Segurança. **Paulo quer começar pela SEGURANÇA** (a "tranca por dentro").
   Criar com **referências reais** (ex: material da Anthropic `defending-code-reference-harness`), **NÃO casca**.
2. Ligar a parte de criar repositório / conectar banco / colocar no ar (hoje o comando só copia o molde local).
3. O questionário pergunta idioma/tela/cara que o molde ainda não usa.
4. Celular não tem molde (só site/serviço).
5. Docs de design (em `keystone/docs/` e `lzr-core/standards/plataforma/`) ainda descrevem o jeito antigo
   ("gerar do zero") — atualizar pra "usa os moldes reais".

## Onde retomar — MUDOU: começar pelos FREIOS, não pela Segurança
Decisão do Paulo no fim da sessão: **antes** de cobrir os pilares faltantes, construir uma **skill de
freios** (viva) que imponha estrutura contra os meus padrões de falha de hoje — porque o próximo pilar
(Segurança) é onde eu já caí, e atacá-lo sem freios é repetir o erro. A skill protege todo o resto do core.

**A skill de freios (versão enxuta primeiro, e cresce a cada novo desvio):**
- Freio anti-casca: antes de eu dizer "pronto/completo/funciona", exigir prova que o Paulo confere
  (comparação/saída de comando). Idealmente vira VIGIA automático (como o de linguagem/branch que já existem).
- Freio anti-reinvenção: antes de CRIAR, mostrar que procurei o que ele já tem.
- Freio anti-não-me-auditar: depois de codar, rodar auditor externo (ferramenta/teste/comparação) e
  mostrar a saída crua, não a minha opinião; quando der, um segundo olhar independente.
- Combinar SKILL (o que fazer) + VIGIAS automáticos (garantem que eu faça / travam a entrega). A força
  está nos vigias (fora do meu controle), não na skill que eu posso pular. Paulo é o freio final.

**Primeira pergunta ao Paulo:** "Vamos construir a skill de freios (versão enxuta) primeiro? Aí eu
ataco a Segurança já debaixo dela. Ou você prefere abrir uma issue e seguir o core?"
**Depois dos freios:** cobrir Segurança (a "tranca por dentro") com referências reais, peça por peça, com prova.

## Como trabalhar com Paulo (CRÍTICO — não esquecer)
- Ele **não lê código** — provar TUDO com o que ele pode conferir (comparação/diff, rodar a ferramenta e
  mostrar a saída passou/falhou). Nunca dizer "pronto/completo" sem essa prova.
- Quando bater num defeito ao aplicar, **corrigir na hora e mostrar** — não empurrar.
- **Resolver a raiz, não mascarar.** Reutilizar o que ele já tem; não reinventar pior.
- Memórias-chave já salvas: `nao-vender-casca-como-completo`, `resolver-raiz-nao-mascarar`,
  `keystone-estado-construcao`, `cobertura-pilares-moldes`, `alma-skill-4-ancoras`, `plataforma-8-pilares`.
