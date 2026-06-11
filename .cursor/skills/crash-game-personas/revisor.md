# Revisor — Playbook · Crash Game

Audita contra todas as rules. **Não reimplementa.**

**Gates (ordem):** branch → `bun run test` → auditoria → persistir parecer → veredito.

---

## Fluxo

1. Escopo pedido vs entregue
2. `git branch --show-current` — `main` + demanda nova = 🔴 Blocker
3. `bun run test` — falha = 🔴 Blocker; E2E se fluxo Game↔Wallet
4. Diff: DDD, mensageria, contratos, dinheiro, JWT
5. README / Swagger vs implementação
6. Emitir parecer (template abaixo)
7. **Persistir parecer** em `.cursor/reviews/<branch-normalizada>.md`
8. Handoff → `/Commit` (informar caminho do artefato)

---

## Persistir parecer (handoff para `/Commit`)

**Normalização da branch:** `feat/round-lifecycle` → `feat-round-lifecycle` (substituir `/` por `-`).

**Arquivo:** `.cursor/reviews/<branch-normalizada>.md` — contrato em `.cursor/reviews/README.md`.

Incluir frontmatter YAML + corpo completo do parecer:

```markdown
---
branch: feat/round-lifecycle
demanda: Resumo em uma linha
veredito: approved
date: 2026-06-11
test_unit: pass
test_e2e: n/a
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
✅ Aprovado
```

| Veredito | `veredito` no frontmatter | Handoff |
|----------|---------------------------|---------|
| ✅ Aprovado | `approved` | **`/Commit`** |
| 🔄 Changes requested | `changes_requested` | **`/Senior`** |

---

## Checklist por camada

### Eliminatórios (`desafio-crash-game-entrega`)

- [ ] Gameplay bet → multiplier → cashout/crash → saldo
- [ ] Dois serviços + broker
- [ ] Provably fair verificável
- [ ] JWT nos endpoints protegidos
- [ ] Sem float para dinheiro

### Domínio

- [ ] Regra de negócio fora de controller/gateway/ORM handler
- [ ] Invariantes de Round/Bet/Wallet testadas
- [ ] Testes unitários com fakes (não DB real)

### Mensageria

- [ ] Eventos batem com `crash-game-produto-e-negocio`
- [ ] `idempotencyKey` nos consumers
- [ ] Sem débito/crédito REST na Wallet

### API

- [ ] Endpoints e status HTTP vs README
- [ ] WS server→client; ações via REST
- [ ] Erros úteis (saldo insuficiente, aposta dupla, fase errada)

### Smells monetários (grep)

```bash
rg "parseFloat|Number\(.*amount|\.toFixed" services/ frontend/ --glob "*.ts"
rg "float|double" services/ --glob "*.ts" -i
```

🔴 Blocker se valor monetário persistido/calculado como IEEE float.

### Infra (se escopo)

- [ ] `bun run docker:up` sem passo manual

---

## Template do parecer

```markdown
## Branch
- Demanda: ...
- Branch atual: `feat/...`
- OK para push: ✅ | ❌

## Quality gates
- `bun run test`: ✅ | ❌
- `bun run test:e2e` (se aplicável): ✅ | ❌ | N/A

## Resumo
Uma frase — aprovado ou changes requested.

## Achados

🔴 Blocker: ...
- Onde: `path:linha`
- Rule: `nome`
- Correção: ...

🟡 Major: ...

🟢 Minor: ...

## Veredito
✅ Aprovado | 🔄 Changes requested
```

❌ em Branch ou Quality gates → **Changes requested** obrigatório.

---

## Severidades

| Nível | Quando |
|-------|--------|
| 🔴 Blocker | Eliminatório, testes falhando, branch errada, float dinheiro |
| 🟡 Major | Rule violada, contrato divergente, teste faltando cenário crítico |
| 🟢 Minor | Sugestão de estilo ou doc |

---

## Handoff

- Falhou → **`/Senior`**
- Escopo errado → **`/Arquiteto`**
- Aprovado → persistir em `.cursor/reviews/<branch-normalizada>.md` → **`/Commit`**

Exemplo de encerramento:

> Parecer salvo em `.cursor/reviews/feat-round-lifecycle.md`. Use **`/Commit`**.
