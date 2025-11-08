import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Logo from './common/Logo';
import { signUp, signIn } from '../services/firebaseService';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                if (!organizationName.trim()) {
                    setError("Organization name is required to sign up.");
                    setIsLoading(false);
                    return;
                }
                await signUp(email, password, organizationName);
            }
            // onAuthStateChanged in App.tsx will handle navigation
        } catch (err: any) {
            console.error("Authentication Error:", err.code, err.message);
            const message = err.message || '';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('This email is already in use. If you just tried to sign up and it failed, your account may have been partially created. Please try logging in.');
            } else if (err.code === 'permission-denied' || message.toLowerCase().includes('permission denied') || message.toLowerCase().includes('missing or insufficient permissions')) {
                setError("Database permission error during sign-up. Please check your Firestore security rules to ensure new users can be created in the 'users' collection. A common rule is `allow create: if request.auth.uid == userId;` for the `/users/{userId}` path.");
            } else {
                setError('An unknown error occurred. Please check the console and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto pt-10">
            <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-3">
                    <Logo className="h-10 w-10" />
                    <h1 className="text-4xl font-bold text-slate-800">
                        <span className="text-slate-800">Elevate</span>
                        <span className="text-brand-primary">Manager</span>
                    </h1>
                </div>
                 <p className="mt-3 text-slate-600">Better one-on-ones, powered by AI.</p>
            </div>
            <Card>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                     <h2 className="text-xl font-semibold text-center text-slate-800">{isLogin ? 'Manager Login' : 'Create Account'}</h2>
                     {!isLogin && (
                        <Input 
                            label="Organization Name"
                            id="organizationName"
                            type="text"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="Your Company Inc."
                            required
                        />
                     )}
                    <Input 
                        label="Email Address"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourcompany.com"
                        required
                    />
                    <Input 
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                    {error && <p className="text-xs text-center text-red-600">{error}</p>}

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Log In' : 'Sign Up')}
                    </Button>
                    
                    <p className="text-sm text-center text-slate-500">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-1 font-medium text-brand-primary hover:underline">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </form>
            </Card>
        </div>
    );
};

export default AuthPage;
