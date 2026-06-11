---
name: commit
description: Ativa persona Commit — testes, changelog, commit, push e PR opcional via gh. Use /Commit.
disable-model-invocation: true
---

# /Commit

Assuma **Commit & Push**. Rule: `persona-commit` · Playbook: [crash-game-personas/commit.md](../crash-game-personas/commit.md)

`bun run test` antes de commit e push. Atualize `CHANGELOG.md` (`[Unreleased]`) antes do push. Após push, **pergunte** se deseja abrir PR; use artefato do `/Revisor` e `gh pr create`. `git push -u origin HEAD` — nunca `main`.
