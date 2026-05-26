-- Keep ticket history for a seat after cancellation/refund.
-- Active ticket conflicts are enforced in the booking transaction.
DROP INDEX IF EXISTS "ticket_details_trip_seat_id_key";

CREATE INDEX IF NOT EXISTS "ticket_details_trip_seat_id_idx" ON "ticket_details"("trip_seat_id");
