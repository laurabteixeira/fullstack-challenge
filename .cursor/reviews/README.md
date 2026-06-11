# Handoff Revisor → Commit

Artefatos efêmeros de auditoria entre `/Revisor` e `/Commit`.

## Contrato

| Campo | Valor |
|-------|-------|
| Quem escreve | `/Revisor` — ao emitir veredito |
| Quem lê | `/Commit` — ao montar PR (opcional) |
| Caminho | `.cursor/reviews/<branch-normalizada>.md` |
| Normalização | `feat/round-lifecycle` → `feat-round-lifecycle` (substituir `/` por `-`) |
| Versionado | **Não** — `*.md` nesta pasta estão no `.gitignore` |

## Formato

```markdown
---
branch: feat/round-lifecycle
demanda: Resumo em uma linha
veredito: approved | changes_requested
date: YYYY-MM-DD
test_unit: pass | fail
test_e2e: pass | fail | n/a
---

## Branch
...

## Quality gates
...

## Resumo
...

## Achados
...

## Veredito
✅ Aprovado | 🔄 Changes requested
```

## Regras

- `veredito: approved` → `/Commit` pode incluir auditoria no PR
- `veredito: changes_requested` → `/Commit` **não** abre PR; handoff `/Senior`
- Branch no frontmatter deve bater com `git branch --show-current`
