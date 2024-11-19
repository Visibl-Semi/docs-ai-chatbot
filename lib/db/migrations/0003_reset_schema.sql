-- First drop all tables in the correct order to handle foreign key constraints
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Suggestion" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Recreate tables with consistent UUID types
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(64) NOT NULL,
    "password" VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS "Chat" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chatId" UUID NOT NULL,
    "role" VARCHAR NOT NULL,
    "content" JSON NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") 
        REFERENCES "Chat"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Vote" (
    "chatId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,
    CONSTRAINT "Vote_chatId_messageId_pk" PRIMARY KEY("chatId", "messageId"),
    CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") 
        REFERENCES "Chat"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") 
        REFERENCES "Message"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Document" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "userId" UUID NOT NULL,
    CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Suggestion_userId_User_id_fk" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Suggestion_documentId_Document_id_fk" FOREIGN KEY ("documentId") 
        REFERENCES "Document"("id") ON DELETE CASCADE
); 