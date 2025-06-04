-- CreateTable
CREATE TABLE `AccountTier` (
    `id` VARCHAR(191) NOT NULL,
    `tierKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `publicationLimit` INTEGER NULL,
    `price` INTEGER NOT NULL,
    `features` TEXT NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `bgColor` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AccountTier_tierKey_key`(`tierKey`),
    INDEX `AccountTier_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
