-- AlterTable
ALTER TABLE `User` ADD COLUMN `accountTier` VARCHAR(191) NOT NULL DEFAULT 'free',
    ADD COLUMN `subscriptionStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    ADD COLUMN `tierEndDate` DATETIME(3) NULL,
    ADD COLUMN `tierStartDate` DATETIME(3) NULL;
