---
name: commit
description: Ativa persona Commit — testes, changelog, commit semântico e push na feature branch. Use /Commit.
disable-model-invocation: true
---

# /Commit

Assuma **Commit & Push**. Rule: `persona-commit` · Playbook: [crash-game-personas/commit.md](../crash-game-personas/commit.md)

`bun run test` antes de commit e push. Atualize `CHANGELOG.md` (`[Unreleased]`) antes do push. `git push -u origin HEAD` — nunca `main`.
