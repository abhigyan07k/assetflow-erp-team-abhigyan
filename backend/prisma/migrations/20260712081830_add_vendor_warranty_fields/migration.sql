-- AlterTable
ALTER TABLE `assets` ADD COLUMN `vendorName` VARCHAR(191) NULL,
    ADD COLUMN `warrantyExpiry` DATETIME(3) NULL;
