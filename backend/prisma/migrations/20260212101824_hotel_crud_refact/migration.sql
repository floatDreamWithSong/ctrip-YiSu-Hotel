/*
  Warnings:

  - You are about to drop the column `en_name` on the `hotels` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `hotels` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[published_info_id]` on the table `hotels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hotel_nickname` to the `hotels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `hotels` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RejectReasonType" AS ENUM ('INFO_INCOMPLETE', 'INFO_INACCURATE', 'IMAGE_QUALITY', 'PRICE_ABNORMAL', 'DUPLICATE', 'POLICY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('PER_NIGHT', 'PER_HOUR');

-- AlterTable
ALTER TABLE "hotels" DROP COLUMN "en_name",
DROP COLUMN "name",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hotel_nickname" TEXT NOT NULL,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_home_ad_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "published_info_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "hotel_infos" (
    "id" SERIAL NOT NULL,
    "hotel_id" INTEGER NOT NULL,
    "info_nickname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "en_name" TEXT,
    "star_level" INTEGER NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT NOT NULL,
    "location_geog" geography(Point,4326),
    "opened_at" TIMESTAMP(3),
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "home_ad_image" TEXT,

    CONSTRAINT "hotel_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" SERIAL NOT NULL,
    "info_id" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "price_mode" "PriceMode" NOT NULL DEFAULT 'PER_NIGHT',
    "bed_type" TEXT,
    "max_guests" INTEGER NOT NULL,
    "area" DOUBLE PRECISION,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_images" (
    "id" SERIAL NOT NULL,
    "info_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "caption" TEXT,

    CONSTRAINT "hotel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "hotel_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_tag_relations" (
    "id" SERIAL NOT NULL,
    "info_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "hotel_tag_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_records" (
    "id" SERIAL NOT NULL,
    "hotel_id" INTEGER NOT NULL,
    "info_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "action" "ReviewStatus" NOT NULL,
    "reject_reason" "RejectReasonType",
    "reject_detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_hotel_info_hotel_id" ON "hotel_infos"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_hotel_info_review_status" ON "hotel_infos"("review_status");

-- CreateIndex
CREATE INDEX "idx_room_type_info_id" ON "room_types"("info_id");

-- CreateIndex
CREATE INDEX "idx_room_type_price" ON "room_types"("price");

-- CreateIndex
CREATE INDEX "idx_hotel_image_info_id" ON "hotel_images"("info_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_tags_name_key" ON "hotel_tags"("name");

-- CreateIndex
CREATE INDEX "idx_hotel_tag_category" ON "hotel_tags"("category");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_tag_relations_info_id_tag_id_key" ON "hotel_tag_relations"("info_id", "tag_id");

-- CreateIndex
CREATE INDEX "idx_review_record_hotel_id" ON "review_records"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_review_record_info_id" ON "review_records"("info_id");

-- CreateIndex
CREATE INDEX "idx_review_record_reviewer_id" ON "review_records"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_published_info_id_key" ON "hotels"("published_info_id");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_published_info_id_fkey" FOREIGN KEY ("published_info_id") REFERENCES "hotel_infos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_infos" ADD CONSTRAINT "hotel_infos_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_info_id_fkey" FOREIGN KEY ("info_id") REFERENCES "hotel_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_info_id_fkey" FOREIGN KEY ("info_id") REFERENCES "hotel_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_tag_relations" ADD CONSTRAINT "hotel_tag_relations_info_id_fkey" FOREIGN KEY ("info_id") REFERENCES "hotel_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_tag_relations" ADD CONSTRAINT "hotel_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "hotel_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_info_id_fkey" FOREIGN KEY ("info_id") REFERENCES "hotel_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "admin_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
