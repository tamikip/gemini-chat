import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
      <input
        className={`w-full px-4 py-3 bg-nexus-800 border ${error ? 'border-red-500' : 'border-nexus-600'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-nexus-400 focus:ring-1 focus:ring-nexus-400 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};