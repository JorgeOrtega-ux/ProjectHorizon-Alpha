-- Project Horizon SQL Backup
-- Generation Time: 2025-10-17 21:17:52

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `comment_likes` VALUES("1","1","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","1","2025-10-17 14:14:15");


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

INSERT INTO `galleries` VALUES("1","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","pruebaf","0","visible","2025-10-17 12:26:46");


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

INSERT INTO `galleries_metadata` VALUES("1","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","1","0","2100000021","2025-10-17 14:15:35");


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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_photos` VALUES("26","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f284d02a9f09.18571165.png","","photo","13");
INSERT INTO `gallery_photos` VALUES("27","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f2861702ca14.86618680.png","","photo","12");
INSERT INTO `gallery_photos` VALUES("28","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f286175dc3a3.18416011.png","","photo","11");
INSERT INTO `gallery_photos` VALUES("29","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28617953921.28637343.png","","photo","2");
INSERT INTO `gallery_photos` VALUES("30","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28617bd7734.07510508.png","","photo","1");
INSERT INTO `gallery_photos` VALUES("31","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28617e61752.21852787.png","","photo","3");
INSERT INTO `gallery_photos` VALUES("32","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28618187b16.75781355.png","","photo","4");
INSERT INTO `gallery_photos` VALUES("33","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28618411c70.65634943.png","","photo","5");
INSERT INTO `gallery_photos` VALUES("34","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f286185d8b09.57022442.png","","photo","6");
INSERT INTO `gallery_photos` VALUES("35","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f2861888e8d0.61906156.png","","photo","10");
INSERT INTO `gallery_photos` VALUES("36","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28618ad68d6.97872537.png","","photo","9");
INSERT INTO `gallery_photos` VALUES("37","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28618c9cff0.71990369.png","","photo","8");
INSERT INTO `gallery_photos` VALUES("38","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f28618ec43e0.98161260.png","","photo","7");
INSERT INTO `gallery_photos` VALUES("39","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f29475f2bc76.71948787.mp4","uploads/gallery_photos/thumb_68f294770554e5.58487503.jpg","video","0");
INSERT INTO `gallery_photos` VALUES("40","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","uploads/gallery_photos/68f2947a305171.80026894.mp4","uploads/gallery_photos/thumb_68f2947d4c3d00.44054810.jpg","video","0");


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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_photos_metadata` VALUES("26","26","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("27","27","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("28","28","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("29","29","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("30","30","0","0","2000000");
INSERT INTO `gallery_photos_metadata` VALUES("31","31","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("32","32","0","0","1");
INSERT INTO `gallery_photos_metadata` VALUES("33","33","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("34","34","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("35","35","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("36","36","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("37","37","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("38","38","0","0","0");
INSERT INTO `gallery_photos_metadata` VALUES("39","39","0","0","3");
INSERT INTO `gallery_photos_metadata` VALUES("40","40","1","0","5");


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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_social_links` VALUES("1","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","facebook","r");


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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `photo_comments` VALUES("1","40","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","ca","visible","2025-10-17 14:14:11","");


DROP TABLE IF EXISTS `profanity_filter`;
CREATE TABLE `profanity_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL,
  `language_code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `word_language_unique` (`word`,`language_code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `profanity_filter` VALUES("11","66","de-DE");
INSERT INTO `profanity_filter` VALUES("4","asshole","en-US");
INSERT INTO `profanity_filter` VALUES("10","caralho","pt-BR");
INSERT INTO `profanity_filter` VALUES("6","connard","fr-FR");
INSERT INTO `profanity_filter` VALUES("9","merda","pt-BR");
INSERT INTO `profanity_filter` VALUES("5","merde","fr-FR");
INSERT INTO `profanity_filter` VALUES("1","mierda","es-419");
INSERT INTO `profanity_filter` VALUES("2","pendejo","es-419");
INSERT INTO `profanity_filter` VALUES("3","shit","en-US");


DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(255) NOT NULL,
  `action_type` enum('login_fail','reset_fail','reset_request') NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_identifier` (`user_identifier`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



DROP TABLE IF EXISTS `server_settings`;
CREATE TABLE `server_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `server_settings` VALUES("ad_probability","15_cooldown");
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_favorites` VALUES("2","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","40","2025-10-17 14:14:08");


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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



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
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_history` VALUES("1","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casa","{\"section\":\"home\"}","2025-10-17 12:12:48");
INSERT INTO `user_history` VALUES("2","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casaca","{\"section\":\"home\"}","2025-10-17 12:12:49");
INSERT INTO `user_history` VALUES("3","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacaca","{\"section\":\"home\"}","2025-10-17 12:12:50");
INSERT INTO `user_history` VALUES("4","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacaca","{\"section\":\"home\"}","2025-10-17 12:12:51");
INSERT INTO `user_history` VALUES("5","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacaca","{\"section\":\"home\"}","2025-10-17 12:12:51");
INSERT INTO `user_history` VALUES("6","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacs","{\"section\":\"home\"}","2025-10-17 12:12:52");
INSERT INTO `user_history` VALUES("7","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsd","{\"section\":\"home\"}","2025-10-17 12:12:53");
INSERT INTO `user_history` VALUES("8","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsdewe","{\"section\":\"home\"}","2025-10-17 12:12:53");
INSERT INTO `user_history` VALUES("9","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsdeweweg","{\"section\":\"home\"}","2025-10-17 12:12:54");
INSERT INTO `user_history` VALUES("10","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsdewewegeg","{\"section\":\"home\"}","2025-10-17 12:12:54");
INSERT INTO `user_history` VALUES("11","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsdewewegegr","{\"section\":\"home\"}","2025-10-17 12:12:55");
INSERT INTO `user_history` VALUES("12","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","search","casacacacacaacsdewewegegrger","{\"section\":\"home\"}","2025-10-17 12:12:55");
INSERT INTO `user_history` VALUES("16","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","12","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f27c6fbe63b1.95101949.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:27:24");
INSERT INTO `user_history` VALUES("18","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","1","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f27c6e094324.28512631.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:27:24");
INSERT INTO `user_history` VALUES("21","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","11","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f27c6f974af0.82860279.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:27:25");
INSERT INTO `user_history` VALUES("24","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","10","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f27c6f74e917.20614120.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:27:41");
INSERT INTO `user_history` VALUES("25","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","3","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f27c6e5f5995.64552467.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:27:43");
INSERT INTO `user_history` VALUES("27","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","14","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f2838da46ef1.56057924.mp4\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 12:57:46");
INSERT INTO `user_history` VALUES("38","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","26","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f284d02a9f09.18571165.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 13:16:23");
INSERT INTO `user_history` VALUES("40","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","31","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f28617e61752.21852787.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 13:19:13");
INSERT INTO `user_history` VALUES("41","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","32","{\"profile_picture_url\":null,\"gallery_name\":\"prueba\",\"photo_url\":\"uploads/gallery_photos/68f28618187b16.75781355.png\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 13:19:20");
INSERT INTO `user_history` VALUES("75","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","39","{\"profile_picture_url\":null,\"gallery_name\":\"pruebaf\",\"photo_url\":\"uploads/gallery_photos/68f29475f2bc76.71948787.mp4\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 14:13:39");
INSERT INTO `user_history` VALUES("77","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","photo","40","{\"profile_picture_url\":null,\"gallery_name\":\"pruebaf\",\"photo_url\":\"uploads/gallery_photos/68f2947a305171.80026894.mp4\",\"gallery_uuid\":\"ff643263-805e-4aa6-9f1f-2e0d5bd7b557\"}","2025-10-17 14:13:52");
INSERT INTO `user_history` VALUES("78","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","profile","ff643263-805e-4aa6-9f1f-2e0d5bd7b557","{\"name\":\"pruebaf\",\"privacy\":0,\"profile_picture_url\":null}","2025-10-17 14:15:35");


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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_metadata` VALUES("1","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","","","");
INSERT INTO `user_metadata` VALUES("2","234aca02-603c-4de0-a67e-d1fd9b54dd68","","","");
INSERT INTO `user_metadata` VALUES("3","92c538d2-0114-49c3-929a-fa42f153879e","","","");


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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_preferences` VALUES("1","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","light","es-419","0","0","1","1");
INSERT INTO `user_preferences` VALUES("2","234aca02-603c-4de0-a67e-d1fd9b54dd68","light","es-419","0","0","1","1");
INSERT INTO `user_preferences` VALUES("3","92c538d2-0114-49c3-929a-fa42f153879e","system","es-419","0","0","1","1");


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
  `control_number` varchar(12) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `control_number` (`control_number`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` VALUES("1","8a10c36c-5979-4547-b5bd-e8f7d22e5f24","Jorge","12@gmail.com","$2y$10$l7ZRCwXQAcSNmeV7SfHuZuTZp3bIaftxHuUncMaxR3wlOt7xRAWNq","founder","2025-10-15 12:12:18","active","","5BC1508464D8","192.168.1.156","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
INSERT INTO `users` VALUES("2","234aca02-603c-4de0-a67e-d1fd9b54dd68","Je","js@gmail.com","$2y$10$GhsLwiVer2249ChVMxxcyu7wMefksgLe6bJTDwySUaJTLJK62QLbK","user","2025-10-17 12:51:54","active","","","192.168.1.152","Mozilla/5.0 (iPhone; CPU iPhone OS 26_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1");
INSERT INTO `users` VALUES("3","92c538d2-0114-49c3-929a-fa42f153879e","Jsj","JorgeOrtega2405b@gmail.com","$2y$10$PC.RBSGJ1h21rwpsIHkCDuPJmwIQUDt8JwLztFnGSR39BIx8SHseK","user","2025-10-18 12:53:41","active","","","192.168.1.152","Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1");
INSERT INTO `users` VALUES("6","92c538d2-011466-49c3-929a-fa42f15387","Jsj6","JorgeOrte6ga2405b@gmail.com","$2y$10$PC.RBSGJ1h21rwpsIHkCDuPJmwIQUDt8JwLztFnGSR39BIx8SHseK","user","2025-10-18 12:53:41","active","","","192.168.1.152","Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1");


DROP TABLE IF EXISTS `verification_codes`;
CREATE TABLE `verification_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('registration','password_reset') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



