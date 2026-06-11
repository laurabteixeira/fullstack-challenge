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

## Fluxo

1. `git branch --show-current`
2. `git status` · `git diff` · `git log -3`
3. `bun run test`
4. Propor commit(s) semânticos
5. `git add` + `git commit` (HEREDOC)
6. `bun run test` novamente
7. Confirmar push
8. `git push -u origin HEAD`

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
chore(cursor): slim alwaysApply rules
```

### Git history (10% da nota)

- Um commit por unidade lógica — não um commit gigante no final
- Mensagem explica o **porquê**, não só o quê
- Progressão: domínio → infra → API → testes (quando fizer sentido)

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

## Commit
**Mensagem:** feat(games): ...

## Executado
- Commit: abc1234
- Push: ok
```

---

## Handoff

Branch/testes falharam → **`/Senior`** · Push ok → abrir PR para `main`
