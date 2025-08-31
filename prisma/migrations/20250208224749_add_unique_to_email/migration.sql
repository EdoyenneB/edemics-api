-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- CreateTable
CREATE TABLE `AcademicSettings` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `settings` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AcademicSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdmissionSettings` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `editPermissions` JSON NULL,
    `widgetPermissions` JSON NULL,
    `nameSettings` JSON NULL,
    `formFields` JSON NULL,
    `feeStructure` JSON NULL,
    `admissionNumberPrefix` VARCHAR(191) NULL,
    `admissionNumberContinueFrom` VARCHAR(191) NULL,
    `customUrl` VARCHAR(191) NULL,
    `sendLinkToParent` VARCHAR(191) NULL,
    `grNumberPrefix` VARCHAR(191) NULL,
    `grNumberContinueFrom` VARCHAR(191) NULL,
    `academicYear` VARCHAR(191) NULL,
    `permittedSessionYear` VARCHAR(191) NULL,
    `sessionDeadline` DATETIME(3) NULL,
    `deadlineMessage` VARCHAR(191) NULL,
    `childAgeCriteria` JSON NULL,
    `documentScreenHeader` VARCHAR(191) NULL,
    `documentScreenSubheader` VARCHAR(191) NULL,
    `requiredDocuments` JSON NULL,
    `loginId` VARCHAR(191) NULL,
    `transactionKey` VARCHAR(191) NULL,
    `showPaymentButton` BOOLEAN NULL,
    `admissionFees` JSON NULL,
    `displayLogo` BOOLEAN NULL,
    `logoPosition` VARCHAR(191) NULL,
    `displaySchoolName` BOOLEAN NULL,
    `schoolNamePosition` VARCHAR(191) NULL,
    `displaySchoolAddress` BOOLEAN NULL,
    `schoolAddressPosition` VARCHAR(191) NULL,
    `displaySchoolPhone` BOOLEAN NULL,
    `schoolPhonePosition` VARCHAR(191) NULL,
    `displaySchoolEmail` BOOLEAN NULL,
    `schoolEmailPosition` VARCHAR(191) NULL,
    `displaySchoolWebsite` BOOLEAN NULL,
    `schoolWebsitePosition` VARCHAR(191) NULL,
    `footerContent` VARCHAR(191) NULL,
    `printSchoolHeader` BOOLEAN NULL,
    `providePrintOption` BOOLEAN NULL,
    `printAfterFormFilled` BOOLEAN NULL,
    `printStudentPhoto` BOOLEAN NULL,
    `selectedFields` JSON NULL,
    `formStatuses` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdmissionSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdmissionForm` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `parentType` VARCHAR(191) NOT NULL,
    `parentName` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `studentFullName` VARCHAR(191) NOT NULL,
    `enrollmentClass` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NULL,
    `previousSchool` VARCHAR(191) NULL,
    `previousPrincipal` VARCHAR(191) NULL,
    `previousPhoneNumber` VARCHAR(191) NULL,
    `houseAddress` VARCHAR(191) NULL,
    `childAllergies` VARCHAR(191) NULL,
    `bloodGroup` VARCHAR(191) NULL,
    `immunizationCertificate` JSON NULL,
    `birthCertificate` JSON NULL,
    `expectations` VARCHAR(191) NULL,
    `siblingNames` VARCHAR(191) NULL,
    `numberOfSiblings` INTEGER NOT NULL,
    `custodyInfo` VARCHAR(191) NULL,
    `billPayment` VARCHAR(191) NULL,
    `pickupPersons` VARCHAR(191) NULL,
    `passportUpload` JSON NULL,
    `senAssessment` VARCHAR(191) NULL,
    `assessmentReport` JSON NULL,
    `fatherFirstName` VARCHAR(191) NULL,
    `fatherLastName` VARCHAR(191) NULL,
    `motherFirstName` VARCHAR(191) NULL,
    `motherLastName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `School` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `School_unique_tenantId`(`tenantId`),
    UNIQUE INDEX `School_composite_unique_tenantId`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Class` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `studentCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AcademicSettings` ADD CONSTRAINT `AcademicSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdmissionForm` ADD CONSTRAINT `AdmissionForm_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `School` ADD CONSTRAINT `School_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
