import React, { ReactNode } from 'react';

// Mock implementations of Clerk components and hooks for development
export const MockClerkProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const MockSignedIn = ({ children }: { children: ReactNode }) => {
  return null; // Never show signed-in content in mock mode
};

export const MockSignedOut = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const MockSignInButton = ({ children, mode }: { children?: ReactNode; mode?: string }) => {
  return (
    <button
      onClick={() => alert('Sign in is disabled in development mode (invalid Clerk API key)')}
      className="cursor-not-allowed opacity-75"
    >
      {children || 'Sign In (Disabled)'}
    </button>
  );
};

export const MockUserButton = () => {
  return null;
};

export const useMockUser = () => {
  return {
    isSignedIn: false,
    isLoaded: true,
    user: null,
  };
};

export const useMockAuth = () => {
  return {
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    getToken: async () => null,
    signOut: async () => {},
  };
};
