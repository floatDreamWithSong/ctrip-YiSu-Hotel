CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_username
ON "users" ("username")
WHERE "realm" IN ('MERCHANT','ADMIN');
