import React from 'react';
import Card from './common/Card';
import Logo from './common/Logo';

const FirebaseConfigErrorPage: React.FC = () => {
  const codeSnippet = `
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};`;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
         <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3">
                <Logo className="h-10 w-10" />
                <h1 className="text-4xl font-bold text-slate-800">
                    <span className="text-slate-800">Elevate</span>
                    <span className="text-brand-primary">Manager</span>
                </h1>
            </div>
        </div>
        <Card className="border-red-300 bg-red-50">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-red-800 text-center">Configuration Required</h2>
            <p className="mt-4 text-red-700 text-center">
              This application requires a connection to a Google Firebase project to function.
            </p>
            <div className="mt-6 text-left">
              <p className="font-semibold text-slate-800">To fix this, please follow these steps:</p>
              <ol className="list-decimal list-inside mt-2 space-y-2 text-slate-700">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline hover:text-brand-dark">Firebase Console</a> and create a new project.</li>
                <li>In your new project, create a new Web App.</li>
                <li>Firebase will provide you with a configuration object. Copy it.</li>
                <li>
                  Open the file <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-sm font-mono">config/firebase.ts</code> in your project editor.
                </li>
                <li>Paste your configuration object into the file, replacing the placeholder values.</li>
              </ol>
            </div>
            <div className="mt-6">
                <p className="text-sm font-semibold text-slate-800">It should look like this:</p>
                <pre className="mt-2 bg-slate-800 text-white p-4 rounded-md text-sm overflow-x-auto">
                    <code>
                        {codeSnippet}
                    </code>
                </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FirebaseConfigErrorPage;
