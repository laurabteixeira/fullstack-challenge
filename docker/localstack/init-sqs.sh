#!/bin/sh
set -eu

QUEUES="
crash-bet-debit-requested
crash-bet-debited
crash-bet-debit-failed
crash-bet-cancelled
crash-round-settled
crash-round-settlement-done
"

for queue in $QUEUES; do
  awslocal sqs create-queue --queue-name "$queue" >/dev/null
  echo "Created SQS queue: $queue"
done
