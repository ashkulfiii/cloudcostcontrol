import { type CreateTenant, type IsAccessible } from 'wasp/server/operations'
import { Tenant } from 'wasp/entities'

export const createTenant: CreateTenant<string, Tenant> = async (
  azureTenantId,
  context
) => {
  if (!context.user) {
    throw new Error('User not authenticated');
  }

  const tenant = await context.entities.Tenant.create({
    data: {
      azureTenantId: azureTenantId,
      costData: 'data',
    },
  });

  console.log('Tenant created:', tenant);

  return tenant;
};

export const isAccessible: IsAccessible<string, boolean> = async (azureTenantId, context) => {

  const foundTenant = await context.entities.Tenant.findFirst({
    where: { azureTenantId: azureTenantId },
  });

  let result = false;

  await context.entities.Tenant.update({
    where: { id: foundTenant.id },
    data: { accessible: result },
  });

  return result;
}