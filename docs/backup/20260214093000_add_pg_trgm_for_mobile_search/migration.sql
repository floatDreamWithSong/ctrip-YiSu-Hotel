CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "_idx_hotel_infos_name_trgm"
ON "hotel_infos" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "_idx_hotel_infos_en_name_trgm"
ON "hotel_infos" USING gin ("en_name" gin_trgm_ops)
WHERE "en_name" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "_idx_hotel_infos_description_trgm"
ON "hotel_infos" USING gin ("description" gin_trgm_ops)
WHERE "description" IS NOT NULL;
