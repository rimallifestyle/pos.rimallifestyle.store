'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#33040D',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(51, 4, 13, 0.5)',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#33040D',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#33040D',
          },
        },
      }}
    />
  );
}
