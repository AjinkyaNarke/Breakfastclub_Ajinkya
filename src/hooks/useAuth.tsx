import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  loginTime: string | null;
  isLoading: boolean;
}

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    loginTime: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = () => {
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      const adminUsername = localStorage.getItem('adminUsername');
      const adminLoginTime = localStorage.getItem('adminLoginTime');

      if (adminAuthenticated === 'true' && adminUsername && adminLoginTime) {
        // Check if session has expired
        const loginTime = new Date(adminLoginTime).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - loginTime;

        if (timeDiff > SESSION_TIMEOUT) {
          // Session expired, clear everything
          if (import.meta.env.DEV) {
            console.log('Admin session expired, logging out');
          }
          logout();
          return;
        }

        setAuthState({
          isAuthenticated: true,
          username: adminUsername,
          loginTime: adminLoginTime,
          isLoading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          username: null,
          loginTime: null,
          isLoading: false,
        });
      }
    };

    // Check auth on mount
    checkAuth();

    // Set up interval to check session expiration every minute
    const interval = setInterval(checkAuth, 60 * 1000);

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminAuthenticated' || e.key === 'adminUsername' || e.key === 'adminLoginTime') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (username: string) => {
    // Update the auth state immediately when login is called
    setAuthState({
      isAuthenticated: true,
      username: username,
      loginTime: new Date().toISOString(),
      isLoading: false,
    });
    
    // SECURITY: Only log in development mode
    if (import.meta.env.DEV) {
      console.log('Login function called for:', username);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminLoginTime');
    
    setAuthState({
      isAuthenticated: false,
      username: null,
      loginTime: null,
      isLoading: false,
    });

    // Note: The redirect to login page will be handled by the AdminLayout guard
  };

  const extendSession = () => {
    const adminUsername = localStorage.getItem('adminUsername');
    if (adminUsername) {
      const newLoginTime = new Date().toISOString();
      localStorage.setItem('adminLoginTime', newLoginTime);
      
      setAuthState(prev => ({
        ...prev,
        loginTime: newLoginTime,
      }));
    }
  };

  return {
    ...authState,
    login,
    logout,
    extendSession,
  };
};