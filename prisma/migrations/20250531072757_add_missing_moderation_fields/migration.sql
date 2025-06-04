-- AlterTable
ALTER TABLE `User` ADD COLUMN `banReason` TEXT NULL,
    ADD COLUMN `bannedAt` DATETIME(3) NULL,
    ADD COLUMN `moderatedBy` VARCHAR(191) NULL,
    ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspensionCount` INTEGER NOT NULL DEFAULT 0;
