# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — `feat/wallet-service` (2026-06-11)

- Domínio `Wallet` com saldo em centavos (`bigint`) e invariantes de débito/crédito
- Prisma + PostgreSQL com migrations automáticas no Docker (`prisma migrate deploy`)
- `POST /wallets` e `GET /wallets/me` com JWT Keycloak (`sub` → `playerId`)
- Consumer `bet.debit_requested` publicando `bet.debited` ou `bet.debit_failed`
- Idempotência persistente via `idempotency_key` único em `wallet_transactions`
- Testes unitários de domínio/use cases e E2E wallets com Keycloak

### Fixed — `feat/wallet-service` (2026-06-11)

- Imports relativos em `WalletModule` corrigidos para o serviço NestJS subir
- Injeção duplicada de `MessagePublisher` removida em `DebitBetUseCase`
- `MessagePublisher` registrado no módulo de mensageria; healthcheck wallets com `start_period` estendido
- Race de idempotência: conflito P2002 em `saveDebit` republica `bet.debited` sem inconsistência de saldo
- `POST /wallets` retorna HTTP 201 explicitamente via `@HttpCode(201)`

### Added — `feat/sqs-localstack` (2026-06-11)

- LocalStack SQS substitui RabbitMQ no `docker-compose.yml`
- Bootstrap automático de 6 filas via `docker/localstack/init-sqs.sh`
- Pacote `@crash/messaging` com eventos, envelope, client SQS, consumer e ports
- `MessagingModule` scaffold em `games` e `wallets` com health `messaging: ok|degraded`
- Variáveis dos serviços inline no `docker-compose.yml` (sem `.env` manual no Docker)
- CI e README atualizados para SQS/LocalStack

### Fixed — `feat/sqs-localstack` (2026-06-11)

- Health retorna HTTP 503 e `status: degraded` quando SQS indisponível
- Consumer com try/catch, cache de queue URL e dedup in-memory por `idempotencyKey`
- Validação de `eventType` canônico no envelope
- E2E publish → receive via LocalStack
- LocalStack healthcheck usa `/_localstack/init/ready` no CI (LocalStack 4.x)

### Added — `chore/commit-changelog` (2026-06-11)

- Persona `/Commit` exige atualização deste changelog antes de cada push
- Playbook e rules em `.cursor/` com formato, fluxo e template de resposta

### Added — `chore/commit-pr-handoff` (2026-06-11)

- `/Revisor` persiste parecer em `.cursor/reviews/<branch>.md` para handoff
- `/Commit` pergunta se abre PR via `gh` com título, summary e auditoria do Revisor
- Contrato documentado em `.cursor/reviews/README.md`; artefatos efêmeros no `.gitignore`
- `README.md` referencia `gh` com link ao manual oficial (sem passo a passo inline)

### Fixed — `fix/commit-gh-repo` (2026-06-11)

- `/Commit` exige `--repo` derivado de `origin` no `gh pr create` (evita default apontando para upstream)
- Proíbe footers `Made with Cursor`, co-authored e atribuições a IDE/agente em commits e PRs
- Playbook documenta `git commit-tree` quando o IDE injeta `Co-authored-by` após `git commit`
