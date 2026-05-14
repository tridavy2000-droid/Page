-- ============================================================
-- ElevenLabs Voice Agent Manager Bot — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS elevenlabs_bot
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elevenlabs_bot;

-- -----------------------------------------------
-- Users: Telegram accounts
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `telegram_id` BIGINT      NOT NULL UNIQUE,
  `username`    VARCHAR(255) DEFAULT '',
  `first_name`  VARCHAR(255) DEFAULT '',
  `created_at`  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_telegram_id` (`telegram_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- User Agents: each row links one Telegram user
-- to one ElevenLabs agent they own.
-- One user can have many agents.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `user_agents` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `telegram_id` BIGINT       NOT NULL,
  `agent_id`    VARCHAR(100) NOT NULL,          -- ElevenLabs agent ID, e.g. "agt_abc123"
  `agent_name`  VARCHAR(255) DEFAULT 'My Agent',
  `added_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_agent` (`telegram_id`, `agent_id`),
  FOREIGN KEY (`telegram_id`) REFERENCES `users`(`telegram_id`) ON DELETE CASCADE,
  INDEX `idx_telegram_id` (`telegram_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- User States: tracks conversation state.
-- One row per user (upserted on every message).
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `user_states` (
  `telegram_id`       BIGINT       NOT NULL PRIMARY KEY,
  `state`             ENUM(
                        'idle',
                        'agent_selected',
                        'waiting_prompt',
                        'waiting_welcome',
                        'waiting_kb'
                      )            DEFAULT 'idle',
  `selected_agent_id` VARCHAR(100) DEFAULT NULL,  -- currently selected EL agent_id
  `updated_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`telegram_id`) REFERENCES `users`(`telegram_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- Example: Register users and add their agents
-- -----------------------------------------------
-- INSERT INTO users (telegram_id, username, first_name) VALUES (123456789, 'john_doe', 'John');
-- INSERT INTO user_agents (telegram_id, agent_id, agent_name)
--   VALUES (123456789, 'agt_abc123xyz', 'Support Bot'),
--          (123456789, 'agt_def456uvw', 'Sales Bot');

-- -----------------------------------------------
-- Useful queries
-- -----------------------------------------------
-- List agents for a user:
-- SELECT agent_id, agent_name FROM user_agents WHERE telegram_id = 123456789;

-- Verify agent belongs to user (security check):
-- SELECT COUNT(*) AS cnt FROM user_agents
--   WHERE telegram_id = 123456789 AND agent_id = 'agt_abc123xyz';

-- Get current state:
-- SELECT state, selected_agent_id FROM user_states WHERE telegram_id = 123456789;
