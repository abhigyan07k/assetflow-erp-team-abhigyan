-- CreateIndex
CREATE INDEX `asset_requests_status_userId_idx` ON `asset_requests`(`status`, `userId`);

-- CreateIndex
CREATE INDEX `assets_status_type_idx` ON `assets`(`status`, `type`);

-- CreateIndex
CREATE INDEX `audit_logs_actionType_performedById_idx` ON `audit_logs`(`actionType`, `performedById`);
