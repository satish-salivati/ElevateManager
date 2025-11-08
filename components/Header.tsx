import React from 'react';
import Logo from './common/Logo';

interface HeaderProps {
  onHome: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHome, onLogout, isLoggedIn }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button onClick={onHome} className="flex items-center space-x-3" disabled={!isLoggedIn}>
          <Logo className="h-8 w-8" />
          <h1 className="text-2xl font-bold text-slate-800">
            <span className="text-slate-800">Elevate</span>
            <span className="text-brand-primary">Manager</span>
          </h1>
        </button>
        {isLoggedIn && (
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-light rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;