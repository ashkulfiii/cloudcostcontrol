-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "azureTenantId" TEXT NOT NULL,
    "costData" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
