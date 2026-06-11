# Cursor — Crash Game

Configuração de personas, rules e playbooks para o desafio Jungle Gaming Crash Game.

---

## Hierarquia de verdade

| Prioridade | Fonte | Conteúdo |
|------------|-------|----------|
| 1 | `README.md` (raiz) | Escopo oficial, stack, critérios |
| 2 | `rules/desafio-crash-game-entrega.mdc` | Eliminatórios + endpoints |
| 3 | `rules/crash-game-produto-e-negocio.mdc` | Domínio + eventos mensageria |
| 4 | `skills/crash-game-personas/*.md` | Exemplos operacionais (não prescrição) |
| 5 | `rules/persona-*.mdc` | Comportamento por slash command |

---

## Fluxo de personas

```
branch → /Arquiteto → /Senior → /Revisor → /Commit → PR
```

| Comando | Rule | Playbook |
|---------|------|----------|
| `/Arquiteto` | `persona-arquiteto` | `skills/crash-game-personas/arquiteto.md` |
| `/Senior` | `persona-senior` + `engenheiro-fullstack-senior` | `skills/crash-game-personas/senior.md` |
| `/Revisor` | `persona-revisor` | `skills/crash-game-personas/revisor.md` |
| `/Commit` | `persona-commit` | `skills/crash-game-personas/commit.md` |

Frontend: rule `frontend-ux` (on-demand) quando escopo incluir UI.

---

## Rules

### alwaysApply (injetadas em todo chat) — 365 linhas total

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `rules/branch-workflow.mdc` | 100 | Branch por demanda |
| `rules/crash-game-produto-e-negocio.mdc` | 86 | Domínio + mensageria |
| `rules/desafio-crash-game-entrega.mdc` | 62 | Eliminatórios + API |
| `rules/infra-docker-local.mdc` | 44 | Docker, Kong, Keycloak |
| `rules/quality-gates.mdc` | 50 | `bun run test` |
| `rules/personas-workflow.mdc` | 23 | Índice de personas |

### on-demand (carregadas pela persona)

| Arquivo | Persona |
|---------|---------|
| `rules/persona-arquiteto.mdc` | `/Arquiteto` |
| `rules/persona-senior.mdc` | `/Senior` |
| `rules/persona-revisor.mdc` | `/Revisor` |
| `rules/persona-commit.mdc` | `/Commit` |
| `rules/engenheiro-fullstack-senior.mdc` | `/Senior` |
| `rules/frontend-ux.mdc` | `/Senior` · `/Arquiteto` (frontend) |

---

## Skills

| Skill | Arquivo | Função |
|-------|---------|--------|
| `arquiteto` | `skills/arquiteto/SKILL.md` | Ativa Arquiteto |
| `senior` | `skills/senior/SKILL.md` | Ativa Senior |
| `revisor` | `skills/revisor/SKILL.md` | Ativa Revisor |
| `commit` | `skills/commit/SKILL.md` | Ativa Commit |
| `crash-game-personas` | `skills/crash-game-personas/SKILL.md` | Ponte para workflow |

Skills são wrappers finos — detalhe nos playbooks.

---

## Validação

```bash
bun run test       # unitários (raiz)
bun run test:e2e   # E2E games (docker:up)
bun run docker:up  # smoke infra
```

---

## Estrutura

```
.cursor/
├── README.md                 ← este arquivo
├── rules/                    ← 12 .mdc
└── skills/
    ├── crash-game-personas/  ← playbooks
    ├── arquiteto/
    ├── senior/
    ├── revisor/
    └── commit/
```
