import React, { useState } from 'react';
import { isAccessible } from 'wasp/client/operations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const GrantAccessForm = ({ tenantId, onSubmit }: { tenantId: string, onSubmit: () => void }) => {
  const [accessible, setAccessible] = useState<boolean>(false);

  const handleCheckAccessibility = async () => {
    // Call the function to check if subscriptions are accessible
    const accessible = await isAccessible(tenantId);
    setAccessible(accessible);
  };

  return (
    <form className='flex items-center gap-4'>
      <label className='text-lg font-medium text-gray-900 dark:text-white'>
        2 - Grant access to cost data for Savionyx
        <a href='https://docs.savionyx.com/guides/onboarding/' target='_blank' rel='noopener noreferrer' className='ml-2 text-blue-500 hover:text-blue-700'>
          <FontAwesomeIcon icon={faInfoCircle} />
        </a>
      </label>
      <button
        type='button'
        onClick={handleCheckAccessibility}
        className='bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600'
      >
        Validate access
      </button>
    </form>
  );
};

export default GrantAccessForm;