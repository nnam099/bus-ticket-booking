CREATE UNIQUE INDEX IF NOT EXISTS "payments_pending_order_key"
  ON "payments"("order_id")
  WHERE "status" = 'PENDING';
