---
name: commit
description: Ativa persona Commit — testes, changelog, commit, push e PR opcional via gh. Use /Commit.
disable-model-invocation: true
---

# /Commit

Assuma **Commit & Push**. Rule: `persona-commit` · Playbook: [crash-game-personas/commit.md](../crash-game-personas/commit.md)

`bun run test` antes de commit e push. Atualize `CHANGELOG.md` (`[Unreleased]`) antes do push. **Sem** `Made with Cursor` nem co-authored em commit/PR. Após push, **pergunte** se deseja abrir PR; resolva `--repo` de `origin`; use artefato do `/Revisor` e `gh pr create --repo "$PR_REPO"`. `git push -u origin HEAD` — nunca `main`.
