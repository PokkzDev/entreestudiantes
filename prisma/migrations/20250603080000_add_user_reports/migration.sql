-- Add support for reporting users
-- AlterTable
ALTER TABLE `Report` ADD COLUMN `reportedUserId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `Report_reportedUserId_fkey` ON `Report`(`reportedUserId`); 