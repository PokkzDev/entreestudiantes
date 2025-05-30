/*
  Warnings:

  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `name`,
    ADD COLUMN `apellidos` VARCHAR(191) NULL,
    ADD COLUMN `nombre` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SubscriptionCancellationLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NOT NULL,
    `previousAccountTier` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `subscriptionStartDate` DATETIME(3) NULL,
    `subscriptionEndDate` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SubscriptionCancellationLog_userId_idx`(`userId`),
    INDEX `SubscriptionCancellationLog_planId_idx`(`planId`),
    INDEX `SubscriptionCancellationLog_cancelledAt_idx`(`cancelledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
