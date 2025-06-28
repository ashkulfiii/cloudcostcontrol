import { type User } from 'wasp/entities';
import { useState } from 'react';
import { DocsUrl } from '../shared/common';

import { createTenant, updateCurrentUser, isAccessible } from 'wasp/client/operations';


import Checklist from './checklist';
import TenantIdForm from './formTenantId';
import GrantAccessForm from './formGrantAccess';

export default function AppPage({ user }: { user: User }) {
  const [tenantId, setTenantId] = useState<string>(user.tenantId);
  const [access, setAccess] = useState<boolean>(false);

  const handleTenantIdSubmit = async (submittedTenantId: string) => {
    console.log('Tenant ID submitted:', submittedTenantId);
    try {
      setTenantId(submittedTenantId); // Update the state
      isAccessible(submittedTenantId);

      // update user
      await updateCurrentUser({ tenantId: submittedTenantId });
      user.tenantId = submittedTenantId;
      
      // create tenant
      const newTenant = await createTenant(submittedTenantId);
      console.log('New tenant created:', newTenant);


    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const handleValidateAccess = async () => {
    let access = await isAccessible(tenantId);
    setAccess(access);
    console.log('Access granted: ', access);
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white'>
            <span className='text-yellow-500'>Azure Cost Management Onboarding</span>
          </h2>
        </div>

        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-white'>
          For more detailed information about the onboarding process, please refer to our <a href={DocsUrl} className='text-blue-500 underline'>documentation</a>.
        </p>

        {/* Onboarding Checklist */}
        <Checklist tenantId={user.tenantId} isAccessible={true} />
 
        {/* Tenant ID Form */}
        <div className='mt-6'>
          <TenantIdForm onSubmit={handleTenantIdSubmit} />
        </div>

        {/* Grant Access Form */}
        <div className='mt-6'>
          <GrantAccessForm tenantId={user.tenantId} onSubmit={handleValidateAccess} />
        </div>
        
      </div>
    </div>
  );
}

