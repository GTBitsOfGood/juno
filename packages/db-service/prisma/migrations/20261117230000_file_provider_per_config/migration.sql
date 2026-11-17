-- File providers move from one global namespace (keyed by name) to one per
-- file config: an autoincrement id becomes the primary key and
-- (name, configId, configEnv) is unique. A bucket now references the provider
-- with the same name in its own config.
--
-- Backfill: existing providers have no owner, but every bucket already belongs
-- to a config. Each provider is copied into every config that has a bucket
-- using it, so existing buckets, uploads and downloads keep working unchanged.
-- Providers that no bucket uses cannot be attributed to a project; they are
-- kept with a NULL config (hidden from every project-scoped route) rather
-- than deleted, so nobody loses credentials they registered.

-- DropForeignKey
ALTER TABLE "FileServiceBucket" DROP CONSTRAINT "FileServiceBucket_fileProviderName_fkey";

-- AlterTable
ALTER TABLE "FileProvider" DROP CONSTRAINT "FileProvider_pkey",
ADD COLUMN     "configEnv" TEXT,
ADD COLUMN     "configId" INTEGER,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FileProvider_pkey" PRIMARY KEY ("id");

-- Backfill: one copy of each provider per config whose buckets use it.
INSERT INTO "FileProvider" ("name", "accessKey", "metadata", "type", "configId", "configEnv")
SELECT DISTINCT p."name", p."accessKey", p."metadata", p."type", b."configId", b."configEnv"
FROM "FileProvider" p
JOIN "FileServiceBucket" b ON b."fileProviderName" = p."name"
WHERE p."configId" IS NULL;

-- The unowned originals of providers that were copied are no longer needed.
DELETE FROM "FileProvider" p
WHERE p."configId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "FileServiceBucket" b WHERE b."fileProviderName" = p."name"
  );

-- CreateIndex
CREATE UNIQUE INDEX "FileProvider_name_configId_configEnv_key" ON "FileProvider"("name", "configId", "configEnv");

-- AddForeignKey
ALTER TABLE "FileProvider" ADD CONSTRAINT "FileProvider_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "FileServiceConfig"("id", "environment") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceBucket" ADD CONSTRAINT "FileServiceBucket_fileProviderName_configId_configEnv_fkey" FOREIGN KEY ("fileProviderName", "configId", "configEnv") REFERENCES "FileProvider"("name", "configId", "configEnv") ON DELETE RESTRICT ON UPDATE CASCADE;
