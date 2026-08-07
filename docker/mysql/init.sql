-- ============================================================
-- TalentIQ — MySQL Initialization Script
-- Runs once when the MySQL container starts for the first time.
-- Creates additional databases for staging/test environments.
-- ============================================================

CREATE DATABASE IF NOT EXISTS talentiq_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS talentiq_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON talentiq_dev.* TO 'talentiq_user'@'%';
GRANT ALL PRIVILEGES ON talentiq_test.* TO 'talentiq_user'@'%';

FLUSH PRIVILEGES;
