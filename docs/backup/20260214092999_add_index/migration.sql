CREATE INDEX "_idx_hotel_infos_location_geog" ON "hotel_infos" USING GIST ("location_geog");

CREATE INDEX "_idx_hotel_infos_city_review_status" ON "hotel_infos"("city", "review_status");

CREATE INDEX "_idx_room_types_info_price_mode" ON "room_types"("info_id", "price", "price_mode");

CREATE INDEX "_idx_hotel_tag_relations_tag_info" ON "hotel_tag_relations"("tag_id", "info_id");
