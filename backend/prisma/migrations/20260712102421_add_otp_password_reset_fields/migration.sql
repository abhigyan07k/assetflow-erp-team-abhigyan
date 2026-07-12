-- AlterTable
ALTER TABLE `users` ADD COLUMN `isOtpVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `otpCode` VARCHAR(191) NULL,
    ADD COLUMN `otpExpires` DATETIME(3) NULL;
