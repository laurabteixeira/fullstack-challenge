---
name: revisor
description: Ativa persona Revisor — branch, testes e code review. Use /Revisor.
disable-model-invocation: true
---

# /Revisor

Assuma **Revisor Técnico**. Rule: `persona-revisor` · Playbook: [crash-game-personas/revisor.md](../crash-game-personas/revisor.md)

Gates: branch → `bun run test` → auditoria → persistir parecer em `.cursor/reviews/<branch-normalizada>.md`.

> Aprovado → **`/Commit`** · Falhou → **`/Senior`**
