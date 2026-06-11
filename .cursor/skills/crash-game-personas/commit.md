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

## Trava #4 — pull request (opcional, com confirmação)

Após push bem-sucedido, **perguntar ao usuário**:

> Push concluído em `origin/<branch>`. **Deseja que eu abra o PR para `main`?** (sim/não)

**Não executar `gh pr create` sem resposta explícita.**

### Pré-requisitos para abrir PR

| Check | Comando / ação |
|-------|----------------|
| `gh` instalado | `gh --version` |
| `gh` autenticado | `gh auth status` |
| Artefato Revisor | `.cursor/reviews/<branch-normalizada>.md` existe |
| Branch consistente | `branch` no frontmatter = `git branch --show-current` |
| Veredito aprovado | `veredito: approved` no frontmatter |

| Falha | Ação |
|-------|------|
| Artefato ausente | STOP — "Execute `/Revisor` antes de abrir PR" |
| `veredito: changes_requested` | STOP — handoff `/Senior` |
| Branch divergente | STOP — inconsistência de handoff |
| `gh` ausente/não autenticado | STOP — instruções de instalação/login |

### Resolver repositório do PR (`--repo` obrigatório)

O push vai para `origin` (`git push -u origin HEAD`), mas o `gh` **sem `--repo`** pode apontar para outro remote (ex.: `upstream`/repo pai) e falhar com *"No commits between main and …"*.

**Sempre** derivar o repo do remote usado no push — nunca confiar no default do `gh`:

```bash
PR_REPO=$(
  git remote get-url origin \
    | sed -E 's#(git@github.com:|https://github.com/)([^/]+)/([^/.]+)(\.git)?$#\2/\3#'
)
# ex.: laurabteixeira/fullstack-challenge
```

Validar antes do `gh pr create`:

```bash
gh repo view "$PR_REPO" --json nameWithOwner -q .nameWithOwner
git log "origin/main..HEAD" --oneline   # deve listar commits da branch
```

| Falha | Ação |
|-------|------|
| `PR_REPO` vazio ou URL não-GitHub | STOP — conferir `git remote get-url origin` |
| `git log origin/main..HEAD` vazio | STOP — branch não publicada ou já mergeada em `origin/main` |
| PR para upstream com branch no fork | `--repo upstream/owner/repo --head fork-owner:branch` (caso avançado; documentar no handoff) |

**Não fazer:** `gh pr create` sem `--repo "$PR_REPO"`.

### PR já existente

```bash
gh pr view "$(git branch --show-current)" --repo "$PR_REPO" 2>/dev/null
```

Se existir → informar URL; não criar duplicata.

### Título do PR

Derivar do commit mais recente da branch (não inventar):

```bash
git log origin/main..HEAD --oneline -1
# fallback se origin/main indisponível:
git log main..HEAD --oneline -1
```

Usar a mensagem do commit como `--title`.

### Body do PR

Somente as três seções abaixo — **sem footer** (`Made with Cursor`, co-authored, etc.):

```markdown
## Summary
- <bullets do CHANGELOG [Unreleased] desta branch, ou commits origin/main..HEAD>

## Revisor audit
<corpo integral do artefato .cursor/reviews/<branch>.md — após o frontmatter YAML>

## Test plan
- [x] `bun run test`
- [ ] `bun run test:e2e` (se escopo integrado)
- [ ] CI verde no PR
```

### Comando

```bash
PR_REPO=$(
  git remote get-url origin \
    | sed -E 's#(git@github.com:|https://github.com/)([^/]+)/([^/.]+)(\.git)?$#\2/\3#'
)

gh pr create --repo "$PR_REPO" --base main \
  --head "$(git branch --show-current)" \
  --title "<título derivado do commit>" \
  --body "$(cat <<'EOF'
## Summary
- ...

## Revisor audit
...

## Test plan
- [x] `bun run test`
EOF
)"
```

Se usuário responder **não** → encerrar; opcionalmente informar link manual:

`https://github.com/${PR_REPO}/pull/new/<branch>` (usar `$PR_REPO` resolvido acima)

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
10. **Perguntar:** deseja abrir PR para `main`?
11. Se sim → resolver `PR_REPO` de `origin` → validar artefato Revisor + `gh` → `gh pr create --repo "$PR_REPO"`
12. Se não → encerrar com resumo

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
chore(cursor): add optional pr creation with revisor audit
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
- `.cursor/reviews/*.md` (handoff efêmero — já no `.gitignore`)

## Nunca incluir em commits nem PRs

**Proibido** em mensagens de commit, títulos/descrições de PR e corpo do `gh pr create`:

- `Made with Cursor` · `Made with [Cursor](...)`
- `Co-authored-by: Cursor` · `Co-Authored-By: ... Cursor ...`
- Footers, badges ou linhas de atribuição a IDE/agente/IA
- Links de marketing do Cursor ou qualquer ferramenta no final do texto

Commits e PRs devem conter **somente** conteúdo técnico (Conventional Commit + seções Summary / Revisor audit / Test plan). Se o ambiente sugerir footer automático, **remover antes** de `git commit` ou `gh pr create`.

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

## Pull request
- Repo: `laurabteixeira/fullstack-challenge` (de `origin`)
- Artefato Revisor: `.cursor/reviews/feat-round-lifecycle.md` ✅ | ❌ ausente
- Pergunta: Deseja abrir PR para `main`? → **aguardando resposta**

---

Após confirmação do usuário:

```markdown
## Pull request
- Repo: `owner/repo` (`--repo` de `origin`)
- Título: feat(games): ...
- URL: https://github.com/.../pull/N
- Body: Summary · Revisor audit · Test plan
```

---

## Handoff

Branch/testes falharam → **`/Senior`** · Push ok → perguntar PR → `gh pr create` se confirmado
