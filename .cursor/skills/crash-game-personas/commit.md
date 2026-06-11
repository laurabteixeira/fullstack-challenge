# Commit — Playbook · Crash Game

Versiona e publica na **feature branch** — somente após `bun run test`.

---

## Trava #1 — branch

```bash
git branch --show-current
```

| Situação | Ação |
|----------|------|
| `main` + demanda/ajuste | **STOP** → criar branch, handoff `/Senior` |
| Feature branch | Confirmar push `origin/[branch]` |

```bash
git push -u origin HEAD   # nunca git push origin main
```

---

## Trava #2 — testes

```bash
bun run test
```

Antes de **commit** e antes de **push**. Falhou → STOP → `/Senior`.

E2E (`bun run test:e2e`) quando escopo alterou fluxo integrado.

---

## Trava #3 — changelog

Antes de cada **push**, atualizar `CHANGELOG.md` na raiz do repositório.

| Regra | Detalhe |
|-------|---------|
| Seção | `[Unreleased]` |
| Granularidade | Um bloco por push (não por commit individual) |
| Cabeçalho do bloco | `### {Added\|Changed\|Fixed\|Removed\|Security} — \`branch\` (YYYY-MM-DD)` |
| Conteúdo | Bullets em linguagem de produto/domínio — refletem o `git diff` real |
| Commit | `CHANGELOG.md` no mesmo commit da mudança ou no último commit antes do push |

**Formato do bloco:**

```markdown
### Added — `feat/round-lifecycle` (2026-06-11)
- Máquina de estados da rodada (`WAITING_BETS` → `RUNNING` → `CRASHED`)
- Testes unitários de transição de fase em `services/games`
```

**Não fazer:**

- Bullets genéricos (`update files`, `fix bug`)
- Entrada inventada que não bate com o diff
- Push sem tocar em `CHANGELOG.md` quando há mudanças substantivas

---

## Fluxo

1. `git branch --show-current`
2. `git status` · `git diff` · `git log -3`
3. `bun run test`
4. Propor commit(s) semânticos
5. **Atualizar `CHANGELOG.md`** — bloco em `[Unreleased]` para este push
6. `git add` (inclui `CHANGELOG.md`) + `git commit` (HEREDOC)
7. `bun run test` novamente
8. Confirmar push
9. `git push -u origin HEAD`

---

## Conventional Commits — escopo monorepo

Formato: `type(scope): descrição imperativa`

| Scope | Quando |
|-------|--------|
| `games` | `services/games` |
| `wallets` | `services/wallets` |
| `frontend` | `frontend/` |
| `docker` | `docker/` · `docker-compose.yml` |
| `cursor` | `.cursor/` |

**Exemplos:**

```
feat(games): add round lifecycle state machine
feat(wallets): consume bet.debit_requested event
fix(games): reject bet outside WAITING_BETS phase
test(wallets): cover insufficient balance debit
chore(docker): update kong routes for websocket
chore(cursor): require changelog on commit persona push
```

### Git history (10% da nota)

- Um commit por unidade lógica — não um commit gigante no final
- Mensagem explica o **porquê**, não só o quê
- Progressão: domínio → infra → API → testes (quando fizer sentido)
- `CHANGELOG.md` complementa commits — visão acumulada por push/PR

---

## Nunca commitar

- `.env` · secrets · credenciais
- `node_modules/` · artefatos de build desnecessários
- Mensagens vagas: `update`, `fix`, `changes`, `wip`

---

## Template de resposta

```markdown
## Branch
- Branch: `feat/...`
- Push: `origin/feat/...`

## Quality gates
- `bun run test`: ✅

## Changelog
- Arquivo: `CHANGELOG.md` → `[Unreleased]`
- Entrada: Added — `feat/...` (2026-06-11)
  - ...

## Commit
**Mensagem:** feat(games): ...

## Executado
- Commit: abc1234
- Push: ok
```

---

## Handoff

Branch/testes falharam → **`/Senior`** · Push ok → abrir PR para `main`
