-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('IT_EQUIPMENT', 'FURNITURE', 'VEHICLE', 'MACHINERY', 'OFFICE_SUPPLIES', 'BUILDING', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_USE', 'IN_STORAGE', 'UNDER_REPAIR', 'DISPOSED');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('SALES', 'MARKETING', 'LABOR', 'OFFICE', 'TRAVEL', 'IT', 'FACILITY', 'OTHER');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_USE',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" BIGINT,
    "currentValue" BIGINT,
    "location" TEXT,
    "assigneeId" TEXT,
    "vendor" TEXT,
    "serialNo" TEXT,
    "notes" TEXT,
    "disposedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "category" "BudgetCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "usedAmount" BIGINT NOT NULL DEFAULT 0,
    "departmentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_year_month_category_departmentId_key" ON "Budget"("year", "month", "category", "departmentId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
