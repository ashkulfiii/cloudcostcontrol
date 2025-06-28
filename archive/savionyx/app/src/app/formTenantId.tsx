import React, { useState } from 'react';

const TenantIdForm = ({ onSubmit }: { onSubmit: (tenantId: string) => void }) => {
  const [tenantId, setTenantId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUUID(tenantId)) {
      setError(null);
      onSubmit(tenantId);
      setIsSubmitted(true); // Hide the form after successful submission
    } else {
      setError('Invalid Tenant ID. Please enter a valid UUID.');
    }
  };

  if (isSubmitted) {
    return (
      <div className='text-center text-green-500'>
        Tenant ID submitted successfully!
      </div>
    ); // Show a success message
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-4'>
      <label htmlFor='tenantId' className='text-lg font-medium text-gray-900 dark:text-white'>
        1 - Enter your Tenant ID
      </label>
      <input
        type='text'
        id='tenantId'
        className='text-sm text-gray-600 flex-grow rounded-md border border-gray-200 bg-[#f5f0ff] shadow-md focus:outline-none focus:border-transparent focus:shadow-none duration-200 ease-in-out hover:shadow-none'
        placeholder='Tenant Id (123e4567-e89b-12d3-a456-426614174000)'
        value={tenantId}
        onChange={(e) => setTenantId(e.currentTarget.value)}
        aria-describedby='tenantIdError'
        aria-invalid={!!error}
      />
      <button
        type='submit'
        className='bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600'
      >
        Submit
      </button>
      {error && <p id='tenantIdError' className='text-red-500'>{error}</p>}
    </form>
  );
};

export default TenantIdForm;