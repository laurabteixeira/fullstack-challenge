# Senior — Playbook · Crash Game

Executor. Implementa seguindo plano do Arquiteto + rules `persona-senior` · `engenheiro-fullstack-senior`.

Se escopo incluir UI: rule `frontend-ux`.

---

## Fluxo

0. `git branch --show-current` — criar branch se `main` com demanda nova
1. Confirmar plano (ou plano breve se trivial e explícito)
2. Classificar: `games` · `wallets` · `frontend` · `docker/`
3. Implementar menor alteração correta
4. `bun run test` (e `bun run test:e2e` se fluxo integrado)
5. README / Swagger / `.env.example` se impacto arquitetural
6. Handoff obrigatório → **`/Revisor`**

---

## Ordem de implementação por feature

```
domain (agregados, VOs, invariantes)
  → application (use cases, handlers de eventos)
    → domain/repositories (contratos)
      → infrastructure (ORM, SQS consumers/publishers)
        → presentation (controllers, DTOs, WS gateway)
          → testes unitários (fakes)
            → E2E se cross-service
```

Não inverter: não criar controller antes do use case.

---

## Precisão monetária

```typescript
// Correto — centavos inteiros
type Cents = bigint;
const betAmount: Cents = 1000n; // R$ 10,00

// Proibido para dinheiro
const bad = 10.50;
parseFloat("10.50");
amount * 1.1; // multiplicador pode ser decimal; resultado em centavos com arredondamento explícito
```

Cashout: `payoutCents = (betCents * multiplierScaled) / scale` — documentar arredondamento.

---

## Mensageria

Nomes canônicos: `crash-game-produto-e-negocio`.

Padrão publisher (games):

```typescript
// Após validar aposta no use case
await publisher.publish('bet.debit_requested', {
  betId, playerId, amount, idempotencyKey,
});
```

Padrão consumer (wallets):

- Verificar `idempotencyKey` antes de debitar
- Publicar `bet.debited` ou `bet.debit_failed`
- Nunca expor débito via REST

---

## JWT (Keycloak)

Endpoints `Auth: Sim` do README:

- Validar Bearer JWT (realm `crash-game`)
- Extrair `sub` como `playerId`
- 401 se ausente/inválido; não inventar auth custom

---

## Testes unitários

- Fakes in-memory em `tests/unit/` — sem PostgreSQL/SQS real
- Cobrir: sucesso, erro, invariantes, bordas (saldo zero, aposta dupla)
- Substituir `smoke.spec.ts` por testes reais ao implementar domínio

```bash
cd services/games && bun test tests/unit
cd services/wallets && bun test tests/unit
bun run test   # raiz
```

---

## Onde implementar

| Mudança | Local |
|---------|-------|
| Round, Bet | `services/games/src/domain/` |
| Wallet | `services/wallets/src/domain/` |
| Use cases | `services/*/src/application/` |
| REST / WS | `services/games/src/presentation/` |
| Consumers | `services/*/src/infrastructure/messaging/` |
| UI | `frontend/src/` |

---

## Auto-verificação (handoff)

- [ ] Branch correta (≠ `main` para demanda nova)
- [ ] `bun run test` passa
- [ ] Sem float para dinheiro
- [ ] Eventos alinhados a `crash-game-produto-e-negocio`
- [ ] README atualizado se decisão arquitetural mudou
- [ ] `docker:up` ok se infra alterada
- [ ] Handoff **`/Revisor`** solicitado (nunca `/Commit` direto)

---

## Handoff para `/Revisor`

Use este resumo ao encerrar:

- Demanda: ...
- Branch: `feat/...`
- Arquivos alterados: ...
- Testes: `bun run test` ✅ | ❌
- Decisões / riscos: ...
- Próximo passo: **`/Revisor`**

> Implementação na branch **`[nome]`**. **`/Revisor`** → **`/Commit`**.
