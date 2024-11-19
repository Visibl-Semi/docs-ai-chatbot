CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT
);

CREATE TABLE IF NOT EXISTS "Chat" (
    id TEXT PRIMARY KEY,
    title TEXT,
    "userId" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY,
    content TEXT,
    role TEXT,
    "chatId" TEXT REFERENCES chat(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Vote" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") 
        REFERENCES "Message"(id) ON DELETE CASCADE,
    CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") 
        REFERENCES "Chat"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Document" (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    "userId" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 