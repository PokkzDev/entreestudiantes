-- CreateTable
CREATE TABLE `DeletedPublicationLog` (
    `id` VARCHAR(191) NOT NULL,
    `publicationId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NULL,
    `images` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `contactMethod` VARCHAR(191) NOT NULL,
    `contactInfo` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `reason` TEXT NULL,
    `deletedBy` VARCHAR(191) NOT NULL,
    `publicationCreatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
