/*
  Warnings:

  - Added the required column `duration` to the `room_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "duration" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "hourly_room_slots" (
    "id" SERIAL NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,

    CONSTRAINT "hourly_room_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_hourly_slot_room_type_id" ON "hourly_room_slots"("room_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_room_slots_room_type_id_start_time_key" ON "hourly_room_slots"("room_type_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_hotel_infos_city_review_status" ON "hotel_infos"("city", "review_status");

-- CreateIndex
CREATE INDEX "idx_hotel_infos_location_geog" ON "hotel_infos" USING GIST ("location_geog");

-- CreateIndex
CREATE INDEX "idx_hotel_tag_relations_tag_info" ON "hotel_tag_relations"("tag_id", "info_id");

-- CreateIndex
CREATE INDEX "idx_room_types_info_price_mode" ON "room_types"("info_id", "price", "price_mode");

-- AddForeignKey
ALTER TABLE "hourly_room_slots" ADD CONSTRAINT "hourly_room_slots_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
