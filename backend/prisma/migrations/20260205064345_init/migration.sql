-- CreateEnum
CREATE TYPE "Realm" AS ENUM ('MOBILE', 'MERCHANT', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "realm" "Realm" NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_profiles" (
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "mobile_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "merchant_profiles" (
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "merchant_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "en_name" TEXT,
    "merchant_id" INTEGER NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_realm_username" ON "users"("realm", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_realm_email_key" ON "users"("realm", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_realm_username_key" ON "users"("realm", "username");

-- CreateIndex
CREATE INDEX "idx_hotels_merchant_id" ON "hotels"("merchant_id");

-- AddForeignKey
ALTER TABLE "mobile_profiles" ADD CONSTRAINT "mobile_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_profiles" ADD CONSTRAINT "merchant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
