-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "bus_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
