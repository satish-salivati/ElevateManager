import React from 'react';
import { AppError } from '../../types';
import Button from './Button';
import CodeBlock from './CodeBlock';

interface FirestoreRulesErrorProps {
  error: AppError;
  onRetry?: () => void;
}

const FirestoreRulesError: React.FC<FirestoreRulesErrorProps> = ({ error, onRetry }) => {
  if (!error || (!error.details && error.type !== 'ADMIN_INDEX_REQUIRED')) return null;

  if (error.type === 'ADMIN_INDEX_REQUIRED') {
      return (
        <div className="text-center py-12 px-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-5H4m16 5H4m16-10H4M6 4v16m12-16v16" />
          </svg>
          <h3 className="mt-4 text-xl font-bold text-amber-900">Database Index Required</h3>
          <p className="mt-2 text-sm text-amber-700 max-w-2xl mx-auto">{error.message}</p>
          <p className="mt-4 text-xs text-slate-500">This is a one-time setup required by Firestore for the admin dashboard to work correctly.</p>
          <div className="mt-6">
            <Button onClick={onRetry}>I've created the index, Retry</Button>
          </div>
        </div>
      );
  }

  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="mt-4 text-xl font-bold text-red-900">{error.type === 'PROFILE_CREATION_FAILED' ? 'Account Setup Incomplete' : 'Admin Permissions Required'}</h3>
      <p className="mt-2 text-sm text-red-700 max-w-2xl mx-auto">{error.message}</p>
      <div className="mt-6 text-left max-w-2xl mx-auto">
        <p className="mb-2 text-slate-600 font-semibold">// This complete ruleset fixes the issue. Paste it into your `firestore.rules` file:</p>
        <CodeBlock code={error.details!} language="rules" />
      </div>
      <p className="mt-4 text-xs text-slate-500">After updating your security rules in the Firebase Console, please {onRetry ? 'retry.' : 'refresh the page.'}</p>
      <div className="mt-6">
        {onRetry ? (
          <Button onClick={onRetry}>Retry</Button>
        ) : (
          <Button variant="secondary" onClick={() => window.location.reload()}>Refresh Page</Button>
        )}
      </div>
    </div>
  );
};

export default FirestoreRulesError;
