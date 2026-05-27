ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "public_code" TEXT;
ALTER TABLE "ticket_details" ADD COLUMN IF NOT EXISTS "public_code" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_public_code_key" ON "orders"("public_code");
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_details_public_code_key" ON "ticket_details"("public_code");

CREATE UNIQUE INDEX IF NOT EXISTS "payments_gateway_txn_id_key"
  ON "payments"("gateway", "gateway_txn_id")
  WHERE "gateway_txn_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ticket_details_active_trip_seat_key"
  ON "ticket_details"("trip_seat_id")
  WHERE "status" IN ('PENDING', 'PAID', 'CHECKED_IN');

ALTER TABLE "otp_codes"
  ADD CONSTRAINT "otp_codes_purpose_check"
  CHECK ("purpose" IN ('REGISTER', 'RESET_PASSWORD', 'DELETE_ACCOUNT', 'PAYMENT'));

ALTER TABLE "trips"
  ADD CONSTRAINT "trips_status_check"
  CHECK ("status" IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'COMPLETED', 'DELAYED', 'CANCELLED'));

ALTER TABLE "trip_seats"
  ADD CONSTRAINT "trip_seats_status_check"
  CHECK ("status" IN ('AVAILABLE', 'PROCESSING', 'BOOKED', 'UNAVAILABLE'));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_status_check"
  CHECK ("status" IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED'));

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_method_check"
  CHECK ("method" IN ('E_WALLET', 'BANK_CARD', 'BANK_TRANSFER', 'CASH', 'REFUND')),
  ADD CONSTRAINT "payments_status_check"
  CHECK ("status" IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  ADD CONSTRAINT "payments_amount_check"
  CHECK (("method" = 'REFUND' AND "amount" <= 0) OR ("method" <> 'REFUND' AND "amount" >= 0));

ALTER TABLE "ticket_details"
  ADD CONSTRAINT "ticket_details_status_check"
  CHECK ("status" IN ('PENDING', 'PAID', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
  ADD CONSTRAINT "ticket_details_price_check"
  CHECK ("price" >= 0);

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_check"
  CHECK ("rating" BETWEEN 1 AND 5);
