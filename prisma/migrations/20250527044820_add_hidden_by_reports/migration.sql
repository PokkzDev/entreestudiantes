-- AlterTable
ALTER TABLE `publicacion` ADD COLUMN `hiddenAt` DATETIME(3) NULL,
    ADD COLUMN `hiddenByReports` BOOLEAN NOT NULL DEFAULT false;
