# Arquiteto — Playbook · Crash Game

> **Exemplos abaixo** — decisões finais no plano e no `README.md`.
> Endpoints e eliminatórios: rule `desafio-crash-game-entrega`.
> Eventos de mensageria canônicos: rule `crash-game-produto-e-negocio`.
> Branches: rule `branch-workflow`.

---

## Mapa do sistema

```
Frontend :3000 ──HTTP/WS──► Kong :8000
                              ├── Game :4001 (PostgreSQL games)
                              └── Wallet :4002 (PostgreSQL wallets)
                                        └── SQS LocalStack ◄──► entre serviços
Keycloak :8080 (JWT)
```

---

## Pesos de avaliação

| Critério | Peso |
|----------|------|
| DDD e Arquitetura | 25% |
| Qualidade de Código | 20% |
| Testes | 20% |
| Frontend/UX | 15% |
| Provably Fair | 10% |
| Histórico Git | 10% |

---

## Guia de canal (exemplo)

| Cenário | Canal |
|---------|-------|
| Consulta saldo / rodada | REST GET |
| Débito/crédito saldo | Broker + saga |
| Tick multiplicador | WebSocket broadcast |
| Apostas/cashouts alheios | WebSocket push |

**Regra:** fronteira `games` ↔ `wallets` → evento (nomes em `crash-game-produto-e-negocio`).

---

## WebSocket — eventos sugeridos (exemplo)

Server → client only. Bet/cashout via REST.

| Evento | Propósito |
|--------|-----------|
| `round.betting_open` | Fase de apostas + `seedHash` |
| `round.started` | Multiplicador sobe |
| `round.tick` | Atualiza curva (`multiplier`, `elapsedMs`) |
| `round.bet_placed` | Lista em tempo real |
| `round.cashout` | Destaque cashout |
| `round.crashed` | Crash + dados verificação |

Trade-off: `wallet.updated` via WS vs poll `GET /wallets/me` após cashout.

---

## Ciclo de vida da rodada (exemplo)

```
WAITING_BETS → RUNNING → CRASHED → SETTLING → WAITING_BETS
```

Invariantes: aposta só em `WAITING_BETS` · cashout só em `RUNNING` · uma aposta/jogador/rodada · 100–100.000 centavos.

---

## Saga — diagrama de referência

Ver fluxos canônicos em `crash-game-produto-e-negocio` (seção Eventos de mensageria).

Exemplo resumido aposta:

```
POST /games/bet → bet.debit_requested → wallets → bet.debited | bet.debit_failed → games confirma/rejeita
```

---

## Provably Fair (exemplo — não única abordagem)

O candidato deve pesquisar e justificar. Exemplo ilustrativo:

- Antes das apostas: publicar `seedHash`; após rodada: revelar `serverSeed` em `/verify`
- Crash point determinístico a partir de seed + `roundId` + fórmula com house edge
- Jogador recalcula com dados do endpoint `GET /games/rounds/:roundId/verify`

---

## Testes no plano

Checklist completo: `desafio-crash-game-entrega` e `README.md`.

Incluir no plano: unitários de domínio + E2E dos fluxos bet/cashout/crash quando aplicável.

---

## Bônus (após eliminatórios)

Outbox/Inbox · auto cashout · OTEL · seed E2E determinística · rate limiting Kong.

---

## Handoff

> Plano pronto. Confirme branch e use **`/Senior`**.
