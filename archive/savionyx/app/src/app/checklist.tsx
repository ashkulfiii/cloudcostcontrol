import React, { useEffect, useState } from 'react';

const Checklist = ({ tenantId, isAccessible }: { tenantId: string, isAccessible: boolean }) => {
  const [items, setItems] = useState([
    { id: 1, text: 'Set Tenant ID', completed: false },
    { id: 2, text: 'Assign the Cost Management Contributor Role (PowerShell or Bash)', completed: false },
    { id: 3, text: 'View preliminary cost data', completed: false },
  ]);

  useEffect(() => {
    setItems(items.map(item => {
      if (item.id === 1) {
        return { ...item, completed: !!tenantId };
      } else if (item.id === 2) {
        return { ...item, completed: isAccessible };
      }
      return item;
    }));
  }, [tenantId, isAccessible]);

  const toggleItemCompletion = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className='my-8 border rounded-3xl border-gray-900/10 dark:border-gray-100/10 p-6'>
      <h3 className='text-lg font-bold text-gray-900 dark:text-white'>Onboarding Checklist</h3>
      <ul className='mt-4 space-y-2'>
        {items.map(item => (
          <li key={item.id} className='flex items-center'>
            <input
              type='checkbox'
              checked={item.completed}
              onChange={() => toggleItemCompletion(item.id)}
              className='mr-2'
              disabled={item.id === 1} // Disable checkbox for "Set Tenant ID"
            />
            <span className={item.completed ? 'line-through text-gray-500' : ''}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Checklist;