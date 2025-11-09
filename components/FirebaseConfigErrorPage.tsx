import React from 'react';
import Card from './common/Card';
import Logo from './common/Logo';
import CodeBlock from './common/CodeBlock';

const FirebaseConfigErrorPage: React.FC = () => {
  const configSnippet = `const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456abcdef"
};`;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
         <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3">
                <Logo className="h-10 w-10" />
                <h1 className="text-4xl font-bold text-slate-800">
                    <span className="text-slate-800">Elevate</span>
                    <span className="text-brand-primary">Manager</span>
                </h1>
            </div>
        </div>
        <Card className="border-red-300">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-red-800 text-center">Configuration Required</h2>
            <p className="mt-4 text-red-700 text-center">
              This application requires a connection to a Google Firebase project to function.
            </p>
            
            <div className="mt-6 text-left">
              <p className="font-semibold text-slate-800">To fix this, please follow these steps:</p>
              <ol className="list-decimal list-inside mt-2 space-y-2 text-slate-700">
                <li>
                  Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-medium hover:underline">Firebase Console</a> and create a new project.
                </li>
                <li>
                  In your new project, create a new <strong>Web App</strong>.
                </li>
                 <li>
                  Firebase will provide you with a `firebaseConfig` object. Copy it.
                </li>
                 <li>
                  Open the file <code className="bg-slate-200 text-slate-800 font-mono text-sm px-1.5 py-0.5 rounded-md">config/firebase.ts</code> in your project editor.
                </li>
                 <li>
                  Paste your configuration object into the file, replacing the placeholder values.
                </li>
              </ol>
            </div>
            
            <div className="mt-6">
                <p className="font-semibold text-slate-800 mb-2">It should look like this:</p>
                <CodeBlock code={configSnippet} language="javascript" />
            </div>

             <div className="mt-6 text-center text-sm text-slate-600">
                <p>After pasting your keys, save the file and redeploy the application.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FirebaseConfigErrorPage;
