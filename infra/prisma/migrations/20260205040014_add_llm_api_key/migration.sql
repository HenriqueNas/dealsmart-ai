-- CreateEnum
CREATE TYPE "LLMProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "llmApiKey" TEXT,
ADD COLUMN     "llmProvider" "LLMProvider" NOT NULL DEFAULT 'ANTHROPIC';
