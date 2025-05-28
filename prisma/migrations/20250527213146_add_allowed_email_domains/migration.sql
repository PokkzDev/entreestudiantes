-- CreateTable
CREATE TABLE `AllowedEmailDomain` (
    `id` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AllowedEmailDomain_domain_key`(`domain`),
    INDEX `AllowedEmailDomain_domain_idx`(`domain`),
    INDEX `AllowedEmailDomain_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
