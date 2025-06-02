/*
  Warnings:

  - You are about to drop the column `subscriptionEndDate` on the `PaymentLog` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionTier` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tierEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tierStartDate` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PaymentLog` DROP COLUMN `subscriptionEndDate`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `subscriptionActive`,
    DROP COLUMN `subscriptionEndDate`,
    DROP COLUMN `subscriptionStatus`,
    DROP COLUMN `subscriptionTier`,
    DROP COLUMN `tierEndDate`,
    DROP COLUMN `tierStartDate`;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT false,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CLP',
    `paymentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_userId_status_idx`(`userId`, `status`),
    INDEX `Subscription_endDate_status_idx`(`endDate`, `status`),
    UNIQUE INDEX `Subscription_userId_paymentId_key`(`userId`, `paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
