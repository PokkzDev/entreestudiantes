-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `rut` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `university` VARCHAR(191) NULL,
    `campus` VARCHAR(191) NULL,
    `accountTier` VARCHAR(191) NOT NULL DEFAULT 'free',
    `tierStartDate` DATETIME(3) NULL,
    `tierEndDate` DATETIME(3) NULL,
    `subscriptionStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `verificationToken` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `resetPasswordToken` VARCHAR(191) NULL,
    `resetPasswordTokenExpiry` DATETIME(3) NULL,
    `nameChangeCount` INTEGER NOT NULL DEFAULT 0,
    `usernameChangeCount` INTEGER NOT NULL DEFAULT 0,
    `universityChangeCount` INTEGER NOT NULL DEFAULT 0,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `isSuspended` BOOLEAN NOT NULL DEFAULT false,
    `isRestricted` BOOLEAN NOT NULL DEFAULT false,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isWarned` BOOLEAN NOT NULL DEFAULT false,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `banReason` TEXT NULL,
    `suspensionReason` TEXT NULL,
    `restrictionReason` TEXT NULL,
    `muteReason` TEXT NULL,
    `warningReason` TEXT NULL,
    `flagReason` TEXT NULL,
    `bannedAt` DATETIME(3) NULL,
    `suspendedAt` DATETIME(3) NULL,
    `suspensionEndsAt` DATETIME(3) NULL,
    `restrictedAt` DATETIME(3) NULL,
    `restrictionEndsAt` DATETIME(3) NULL,
    `mutedAt` DATETIME(3) NULL,
    `muteEndsAt` DATETIME(3) NULL,
    `warnedAt` DATETIME(3) NULL,
    `flaggedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,
    `moderationNotes` TEXT NULL,
    `reportsMade` INTEGER NOT NULL DEFAULT 0,
    `reportsReceived` INTEGER NOT NULL DEFAULT 0,
    `warningCount` INTEGER NOT NULL DEFAULT 0,
    `suspensionCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `lastActivityAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_rut_key`(`rut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Publicacion` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NULL,
    `images` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `contactMethod` VARCHAR(191) NOT NULL,
    `contactInfo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
    `location` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `flagged` BOOLEAN NOT NULL DEFAULT false,
    `flaggedAt` DATETIME(3) NULL,
    `hiddenByReports` BOOLEAN NOT NULL DEFAULT false,
    `hiddenAt` DATETIME(3) NULL,
    `reportCount` INTEGER NOT NULL DEFAULT 0,
    `university` VARCHAR(191) NULL,
    `campus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeletedAccountLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `publicationCount` INTEGER NOT NULL,
    `accountCreatedAt` DATETIME(3) NOT NULL,
    `accountDeletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `images` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `contactMethod` VARCHAR(191) NOT NULL,
    `contactInfo` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL,
    `university` VARCHAR(191) NULL,
    `campus` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `reason` TEXT NULL,
    `deletedBy` VARCHAR(191) NOT NULL,
    `publicationCreatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSuper` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `otpSecret` VARCHAR(191) NULL,
    `otpEnabled` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Admin_username_key`(`username`),
    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `publicacionId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

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
    INDEX `AllowedEmailDomain_domain_idx`(`domain`),
    INDEX `AllowedEmailDomain_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppConfig_key_key`(`key`),
    INDEX `AppConfig_key_idx`(`key`),
    INDEX `AppConfig_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentIntent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CLP',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `mercadoPagoPreferenceId` VARCHAR(191) NULL,
    `mercadoPagoPaymentId` VARCHAR(191) NULL,
    `externalReference` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentIntent_externalReference_key`(`externalReference`),
    INDEX `PaymentIntent_userId_idx`(`userId`),
    INDEX `PaymentIntent_status_idx`(`status`),
    INDEX `PaymentIntent_externalReference_idx`(`externalReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CLP',
    `paymentId` VARCHAR(191) NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT false,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_userId_idx`(`userId`),
    INDEX `Subscription_status_idx`(`status`),
    INDEX `Subscription_planId_idx`(`planId`),
    INDEX `Subscription_endDate_idx`(`endDate`),
    UNIQUE INDEX `Subscription_userId_paymentId_key`(`userId`, `paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Publicacion` ADD CONSTRAINT `Publicacion_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_publicacionId_fkey` FOREIGN KEY (`publicacionId`) REFERENCES `Publicacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentIntent` ADD CONSTRAINT `PaymentIntent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
