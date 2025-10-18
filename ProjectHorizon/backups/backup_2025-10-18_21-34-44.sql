-- Project Horizon SQL Backup
-- Generation Time: 2025-10-18 21:34:43

DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `vote_type` tinyint(4) NOT NULL COMMENT '1 for like, -1 for dislike',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `comment_user_unique` (`comment_id`,`user_uuid`),
  KEY `comment_likes_ibfk_2` (`user_uuid`),
  CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `photo_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `comment_reports`;
CREATE TABLE `comment_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `reporter_uuid` varchar(36) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `comment_reports_ibfk_1` (`comment_id`),
  KEY `comment_reports_ibfk_2` (`reporter_uuid`),
  CONSTRAINT `comment_reports_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `photo_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comment_reports_ibfk_2` FOREIGN KEY (`reporter_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `issue_type` varchar(50) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` text NOT NULL,
  `user_uuid` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `feedback_attachments`;
CREATE TABLE `feedback_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `feedback_uuid` varchar(36) NOT NULL,
  `attachment_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `feedback_attachments_ibfk_1` (`feedback_uuid`),
  CONSTRAINT `feedback_attachments_ibfk_1` FOREIGN KEY (`feedback_uuid`) REFERENCES `feedback` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `galleries`;
CREATE TABLE `galleries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `privacy` tinyint(1) DEFAULT 0,
  `visibility` enum('visible','hidden') NOT NULL DEFAULT 'visible',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `galleries` VALUES("1","e0eff77d-2810-4212-bce5-da68de2c7dd3","yy","0","visible","2025-10-18 11:27:42");


DROP TABLE IF EXISTS `galleries_metadata`;
CREATE TABLE `galleries_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_uuid` varchar(36) NOT NULL,
  `total_likes` int(11) DEFAULT 0,
  `total_saves` int(11) DEFAULT 0,
  `total_interactions` int(11) DEFAULT 0,
  `last_edited` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `galleries_metadata_ibfk_1` (`gallery_uuid`),
  CONSTRAINT `galleries_metadata_ibfk_1` FOREIGN KEY (`gallery_uuid`) REFERENCES `galleries` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `galleries_metadata` VALUES("1","e0eff77d-2810-4212-bce5-da68de2c7dd3","0","0","10","2025-10-18 14:30:41");


DROP TABLE IF EXISTS `gallery_photos`;
CREATE TABLE `gallery_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_uuid` varchar(36) NOT NULL,
  `photo_url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `type` enum('photo','video') NOT NULL DEFAULT 'photo',
  `display_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `gallery_photos_ibfk_1` (`gallery_uuid`),
  CONSTRAINT `gallery_photos_ibfk_1` FOREIGN KEY (`gallery_uuid`) REFERENCES `galleries` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_photos` VALUES("1","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00c4d3bc4.78722599.png","","photo","0");
INSERT INTO `gallery_photos` VALUES("2","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00c875162.96147168.png","","photo","0");
INSERT INTO `gallery_photos` VALUES("3","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00cb9e874.18286790.png","","photo","0");
INSERT INTO `gallery_photos` VALUES("4","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00ce26187.06722015.png","","photo","0");
INSERT INTO `gallery_photos` VALUES("5","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00d12c6c2.57953731.png","","photo","0");
INSERT INTO `gallery_photos` VALUES("6","e0eff77d-2810-4212-bce5-da68de2c7dd3","uploads/gallery_photos/68f3c00d3336c9.26526362.png","","photo","0");


DROP TABLE IF EXISTS `gallery_photos_metadata`;
CREATE TABLE `gallery_photos_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `photo_id` int(11) NOT NULL,
  `likes` int(11) DEFAULT 0,
  `saves` int(11) DEFAULT 0,
  `interactions` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `gallery_photos_metadata_ibfk_1` (`photo_id`),
  CONSTRAINT `gallery_photos_metadata_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `gallery_photos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_photos_metadata` VALUES("1","1","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("2","2","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("3","3","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("4","4","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("5","5","0","0","3");
INSERT INTO `gallery_photos_metadata` VALUES("6","6","0","0","1");


DROP TABLE IF EXISTS `gallery_profile_pictures`;
CREATE TABLE `gallery_profile_pictures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_uuid` varchar(36) NOT NULL,
  `profile_picture_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gallery_uuid` (`gallery_uuid`),
  CONSTRAINT `gallery_profile_pictures_ibfk_1` FOREIGN KEY (`gallery_uuid`) REFERENCES `galleries` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `gallery_social_links`;
CREATE TABLE `gallery_social_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_uuid` varchar(36) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gallery_uuid` (`gallery_uuid`),
  CONSTRAINT `gallery_social_links_ibfk_1` FOREIGN KEY (`gallery_uuid`) REFERENCES `galleries` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `photo_comments`;
CREATE TABLE `photo_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `photo_id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `comment_text` text NOT NULL,
  `status` enum('visible','review','deleted') NOT NULL DEFAULT 'visible',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `parent_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `photo_id` (`photo_id`),
  KEY `user_uuid` (`user_uuid`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `photo_comments_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `gallery_photos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `photo_comments_ibfk_2` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `photo_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `photo_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `profanity_filter`;
CREATE TABLE `profanity_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL,
  `language_code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `word_language_unique` (`word`,`language_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `profanity_filter` VALUES("8","arschloch","de-DE");
INSERT INTO `profanity_filter` VALUES("4","asshole","en-US");
INSERT INTO `profanity_filter` VALUES("10","caralho","pt-BR");
INSERT INTO `profanity_filter` VALUES("6","connard","fr-FR");
INSERT INTO `profanity_filter` VALUES("9","merda","pt-BR");
INSERT INTO `profanity_filter` VALUES("5","merde","fr-FR");
INSERT INTO `profanity_filter` VALUES("1","mierda","es-419");
INSERT INTO `profanity_filter` VALUES("2","pendejo","es-419");
INSERT INTO `profanity_filter` VALUES("7","scheisse","de-DE");
INSERT INTO `profanity_filter` VALUES("3","shit","en-US");


DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(255) NOT NULL,
  `action_type` enum('login_fail','reset_fail','reset_request','verify_fail','password_change_fail','delete_fail') NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_identifier` (`user_identifier`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `security_logs` VALUES("1","12@gmail.com","delete_fail","192.168.8.2","2025-10-18 10:41:31");
INSERT INTO `security_logs` VALUES("2","12@gmail.com","delete_fail","192.168.8.2","2025-10-18 10:41:32");
INSERT INTO `security_logs` VALUES("3","12@gmail.com","delete_fail","192.168.8.2","2025-10-18 10:41:33");
INSERT INTO `security_logs` VALUES("4","12@gmail.com","delete_fail","192.168.8.2","2025-10-18 10:41:33");
INSERT INTO `security_logs` VALUES("5","12@gmail.com","delete_fail","192.168.8.2","2025-10-18 10:41:34");


DROP TABLE IF EXISTS `server_settings`;
CREATE TABLE `server_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `server_settings` VALUES("ad_probability","15");
INSERT INTO `server_settings` VALUES("allow_new_registrations","1");
INSERT INTO `server_settings` VALUES("maintenance_mode","0");
INSERT INTO `server_settings` VALUES("unlock_duration","60");


DROP TABLE IF EXISTS `user_favorites`;
CREATE TABLE `user_favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `photo_id` int(11) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_photo_unique` (`user_uuid`,`photo_id`),
  KEY `user_uuid` (`user_uuid`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `gallery_photos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `user_follows`;
CREATE TABLE `user_follows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `gallery_uuid` varchar(36) NOT NULL,
  `followed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_gallery_unique` (`user_uuid`,`gallery_uuid`),
  KEY `user_uuid` (`user_uuid`),
  KEY `gallery_uuid` (`gallery_uuid`),
  CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`gallery_uuid`) REFERENCES `galleries` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `user_history`;
CREATE TABLE `user_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `history_type` enum('profile','photo','search') NOT NULL,
  `item_id` varchar(255) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `visited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_uuid` (`user_uuid`),
  CONSTRAINT `user_history_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_history` VALUES("2","0012b3df-835a-4dca-a76a-fb128e05b3b1","photo","6","{\"profile_picture_url\":null,\"gallery_name\":\"yy\",\"photo_url\":\"uploads/gallery_photos/68f3c00d3336c9.26526362.png\",\"gallery_uuid\":\"e0eff77d-2810-4212-bce5-da68de2c7dd3\"}","2025-10-18 11:28:00");
INSERT INTO `user_history` VALUES("5","0012b3df-835a-4dca-a76a-fb128e05b3b1","photo","5","{\"profile_picture_url\":null,\"gallery_name\":\"yy\",\"photo_url\":\"uploads/gallery_photos/68f3c00d12c6c2.57953731.png\",\"gallery_uuid\":\"e0eff77d-2810-4212-bce5-da68de2c7dd3\"}","2025-10-18 11:28:02");
INSERT INTO `user_history` VALUES("7","0012b3df-835a-4dca-a76a-fb128e05b3b1","photo","3","{\"profile_picture_url\":null,\"gallery_name\":\"yy\",\"photo_url\":\"uploads/gallery_photos/68f3c00cb9e874.18286790.png\",\"gallery_uuid\":\"e0eff77d-2810-4212-bce5-da68de2c7dd3\"}","2025-10-18 11:28:02");
INSERT INTO `user_history` VALUES("8","0012b3df-835a-4dca-a76a-fb128e05b3b1","photo","2","{\"profile_picture_url\":null,\"gallery_name\":\"yy\",\"photo_url\":\"uploads/gallery_photos/68f3c00c875162.96147168.png\",\"gallery_uuid\":\"e0eff77d-2810-4212-bce5-da68de2c7dd3\"}","2025-10-18 11:28:03");
INSERT INTO `user_history` VALUES("12","0012b3df-835a-4dca-a76a-fb128e05b3b1","profile","e0eff77d-2810-4212-bce5-da68de2c7dd3","{\"name\":\"yy\",\"privacy\":0,\"profile_picture_url\":null}","2025-10-18 14:30:41");


DROP TABLE IF EXISTS `user_metadata`;
CREATE TABLE `user_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `password_last_updated_at` timestamp NULL DEFAULT NULL,
  `username_last_updated_at` timestamp NULL DEFAULT NULL,
  `email_last_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_uuid` (`user_uuid`),
  CONSTRAINT `user_metadata_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_metadata` VALUES("1","0012b3df-835a-4dca-a76a-fb128e05b3b1","","","");


DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `theme` varchar(50) NOT NULL DEFAULT 'system',
  `language` varchar(10) NOT NULL DEFAULT 'es-419',
  `open_links_in_new_tab` tinyint(1) NOT NULL DEFAULT 0,
  `longer_message_duration` tinyint(1) NOT NULL DEFAULT 0,
  `enable_view_history` tinyint(1) NOT NULL DEFAULT 1,
  `enable_search_history` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_uuid` (`user_uuid`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_preferences` VALUES("1","0012b3df-835a-4dca-a76a-fb128e05b3b1","system","es-419","0","0","1","1");


DROP TABLE IF EXISTS `user_sanctions`;
CREATE TABLE `user_sanctions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(36) NOT NULL,
  `admin_uuid` varchar(36) NOT NULL,
  `sanction_type` enum('warning','temp_suspension','permanent_suspension') NOT NULL,
  `reason` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_uuid` (`user_uuid`),
  KEY `admin_uuid` (`admin_uuid`),
  CONSTRAINT `user_sanctions_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `user_sanctions_ibfk_2` FOREIGN KEY (`admin_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','moderator','administrator','founder') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` VALUES("1","0012b3df-835a-4dca-a76a-fb128e05b3b1","12","12@gmail.com","$2y$10$AvtBVTOqGBXjuKTkfG50ZePSSZ37k.fbxgknj6rZfurD6FMViP9f.","founder","2025-10-17 23:40:08","active","","0","192.168.8.2","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");


DROP TABLE IF EXISTS `verification_codes`;
CREATE TABLE `verification_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('registration','password_reset','login') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



