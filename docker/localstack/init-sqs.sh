#!/bin/bash
set -eu

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

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
