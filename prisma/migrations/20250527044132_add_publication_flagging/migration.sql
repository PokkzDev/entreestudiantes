-- AlterTable
ALTER TABLE `publicacion` ADD COLUMN `flagged` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `flaggedAt` DATETIME(3) NULL,
    ADD COLUMN `reportCount` INTEGER NOT NULL DEFAULT 0;
