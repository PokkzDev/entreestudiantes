-- AlterTable
ALTER TABLE `User` ADD COLUMN `subscriptionActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subscriptionEndDate` DATETIME(3) NULL,
    ADD COLUMN `subscriptionTier` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `PaymentLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CLP',
    `flowToken` VARCHAR(191) NOT NULL,
    `commerceOrder` VARCHAR(191) NOT NULL,
    `flowOrder` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subscriptionEndDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentLog_flowToken_key`(`flowToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefundLog` (
    `id` VARCHAR(191) NOT NULL,
    `refundCommerceOrder` VARCHAR(191) NOT NULL,
    `flowRefundOrder` VARCHAR(191) NULL,
    `token` VARCHAR(191) NOT NULL,
    `receiverEmail` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `fee` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `originalCommerceOrder` VARCHAR(191) NULL,
    `originalFlowOrder` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,

    UNIQUE INDEX `RefundLog_refundCommerceOrder_key`(`refundCommerceOrder`),
    UNIQUE INDEX `RefundLog_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AllowedEmailDomain` (
    `id` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AllowedEmailDomain_domain_key`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentLog` ADD CONSTRAINT `PaymentLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefundLog` ADD CONSTRAINT `RefundLog_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefundLog` ADD CONSTRAINT `RefundLog_cancelledBy_fkey` FOREIGN KEY (`cancelledBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
