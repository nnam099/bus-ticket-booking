-- CreateTable
CREATE TABLE "staff_leaves" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "stop_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_leaves_staff_id_start_date_end_date_idx" ON "staff_leaves"("staff_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "route_stops_route_id_order_idx" ON "route_stops"("route_id", "order");

-- CreateIndex
CREATE INDEX "ticket_details_status_idx" ON "ticket_details"("status");

-- CreateIndex
CREATE INDEX "trip_seats_status_lock_expires_at_idx" ON "trip_seats"("status", "lock_expires_at");

-- CreateIndex
CREATE INDEX "trips_route_id_departure_time_status_idx" ON "trips"("route_id", "departure_time", "status");

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
