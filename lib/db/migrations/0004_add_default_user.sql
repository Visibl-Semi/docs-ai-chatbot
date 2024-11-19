INSERT INTO "User" ("id", "email", "password")
VALUES ('00000000-0000-0000-0000-000000000000', 'anonymous@example.com', NULL)
ON CONFLICT ("id") DO NOTHING; 