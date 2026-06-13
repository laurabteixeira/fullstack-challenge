CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "seed_hash" TEXT NOT NULL,
    "server_seed" TEXT,
    "client_seed" TEXT NOT NULL,
    "crash_point_scaled" INTEGER NOT NULL,
    "current_multiplier_scaled" INTEGER NOT NULL DEFAULT 100,
    "betting_ends_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "crashed_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "cashout_multiplier_scaled" INTEGER,
    "payout_cents" BIGINT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bets_idempotency_key_key" ON "bets"("idempotency_key");
CREATE UNIQUE INDEX "bets_round_id_player_id_key" ON "bets"("round_id", "player_id");

ALTER TABLE "bets" ADD CONSTRAINT "bets_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
