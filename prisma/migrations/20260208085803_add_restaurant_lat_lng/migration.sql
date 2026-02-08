-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'LATE_NIGHT');

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishAtRestaurant" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishAtRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "dishAtRestaurantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealSlot" "MealSlot",

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSubscription" (
    "id" TEXT NOT NULL,
    "dishAtRestaurantId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "window" TEXT NOT NULL DEFAULT '24h',
    "minRating" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Restaurant_city_idx" ON "Restaurant"("city");

-- CreateIndex
CREATE INDEX "Dish_name_idx" ON "Dish"("name");

-- CreateIndex
CREATE INDEX "DishAtRestaurant_restaurantId_idx" ON "DishAtRestaurant"("restaurantId");

-- CreateIndex
CREATE INDEX "DishAtRestaurant_dishId_idx" ON "DishAtRestaurant"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "DishAtRestaurant_restaurantId_dishId_key" ON "DishAtRestaurant"("restaurantId", "dishId");

-- CreateIndex
CREATE INDEX "Review_dishAtRestaurantId_createdAt_idx" ON "Review"("dishAtRestaurantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "AlertSubscription_dishAtRestaurantId_idx" ON "AlertSubscription"("dishAtRestaurantId");

-- CreateIndex
CREATE INDEX "AlertSubscription_isActive_idx" ON "AlertSubscription"("isActive");

-- AddForeignKey
ALTER TABLE "DishAtRestaurant" ADD CONSTRAINT "DishAtRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishAtRestaurant" ADD CONSTRAINT "DishAtRestaurant_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dishAtRestaurantId_fkey" FOREIGN KEY ("dishAtRestaurantId") REFERENCES "DishAtRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSubscription" ADD CONSTRAINT "AlertSubscription_dishAtRestaurantId_fkey" FOREIGN KEY ("dishAtRestaurantId") REFERENCES "DishAtRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
