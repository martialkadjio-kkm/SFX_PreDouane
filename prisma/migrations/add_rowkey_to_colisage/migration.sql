-- AlterTable
ALTER TABLE "Colisage" ADD COLUMN "rowKey" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "Colisage_orderTransitId_rowKey_key" ON "Colisage"("OrderTransitId", "rowKey");
