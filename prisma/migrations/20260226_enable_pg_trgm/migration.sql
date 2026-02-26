-- Enable the pg_trgm extension for fuzzy/trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for fast fuzzy search on Restaurant
CREATE INDEX IF NOT EXISTS "Restaurant_name_trgm_idx" ON "Restaurant" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Restaurant_city_trgm_idx" ON "Restaurant" USING GIN ("city" gin_trgm_ops);

-- GIN trigram indexes for fast fuzzy search on Dish
CREATE INDEX IF NOT EXISTS "Dish_name_trgm_idx" ON "Dish" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Dish_cuisine_trgm_idx" ON "Dish" USING GIN ("cuisine" gin_trgm_ops);
