'use client';

import { useState, useEffect } from 'react';
import { GoogleTagManager, GoogleSearchConsole, GoogleAnalytics } from '@/components/icons/Google';
import { toast } from '../Toasts/use-toast';
import AccountSelectionModal, {
  GoogleAccount,
  AccountSelectionProps,
} from '@/components/AccountSelectionModal';

// Google OAuth types
interface GoogleOAuthResponse {
  code: string;
  error?: string;
}

interface GoogleOAuthClient {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: string;
    callback: (response: GoogleOAuthResponse) => void;
  }) => {
    requestCode: () => void;
  };
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2: GoogleOAuthClient;
      };
    };
  }
}

interface ConnectionButtonProps {
  disabled: boolean;
  title: string;
  connecting: boolean;
  icon: React.ReactNode;
  connected: boolean;
  onClick: () => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  disabled,
  title,
  connecting,
  icon,
  connected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={connected || disabled}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
        connected
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
      } transition-colors`}
    >
      {icon}
      <span className="text-sm font-medium text-gray-900">{title}</span>
      {connecting && <span className="text-xs text-gray-500 mt-1">Connecting...</span>}
      {connected && !connecting && <span className="text-xs text-green-600 mt-1">Connected</span>}
    </button>
  );
};

interface GoogleService {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const googleServices: GoogleService[] = [
  {
    id: 'tagManager',
    title: 'Tag Manager',
    icon: <GoogleTagManager className="w-8 h-8 mb-2" />,
  },
  {
    id: 'searchConsole',
    title: 'Search Console',
    icon: <GoogleSearchConsole className="w-11 h-11 mb-2" />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <GoogleAnalytics className="w-8 h-8 mb-2" />,
  },
];

export default function ConnectionsForm() {
  // Connection states
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<{
    searchConsole: any | null;
    tagManager: any | null;
    analytics: any | null;
  }>({
    searchConsole: null,
    tagManager: null,
    analytics: null,
  });

  // Account selection states
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [currentService, setCurrentService] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);

  // Store authentication tokens instead of the code
  const [authTokens, setAuthTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null,
  });

  useEffect(() => {
    // Load Google API client
    const loadGoogleApi = async () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadGoogleApi();
  }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections');
        const data = await response.json();

        if (data.success) {
          setConnections(data.connections);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };

    fetchConnections();
  }, []);

  const handleGoogleConnect = async (service: string) => {
    setIsConnecting(service);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID is not configured');
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google OAuth not loaded yet. Please try again.');
      }

      const scope = getServiceScope(service);
      if (!scope) {
        throw new Error('Invalid service specified');
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: scope,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.code) {
            setCurrentService(service);
            fetchAccounts(response.code, service);
          } else if (response.error) {
            console.error('Google OAuth error:', response.error);
            toast({
              title: 'Connection Failed',
              variant: 'destructive',
              description: `Failed to connect to ${service}: ${response.error}`,
            });
            setIsConnecting(null);
          }
        },
      });

      client.requestCode();
    } catch (error) {
      console.error(`Error initiating ${service} OAuth:`, error);
      toast({
        title: 'Connection Failed',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to connect to service',
      });
      setIsConnecting(null);
    }
  };

  const fetchAccounts = async (code: string, service: string) => {
    try {
      // First authenticate with Google to get the tokens
      const authResponse = await fetch('/api/connections/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          service,
          redirect_uri: window.location.origin,
          storeConnection: false, // Don't store the connection yet
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        console.log('Auth error:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate with Google');
      }

      const authData = await authResponse.json();
      console.log('Auth response:', authData);

      // Store the tokens for later use during finalization
      if (authData.access_token && authData.refresh_token) {
        setAuthTokens({
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
        });
      } else {
        throw new Error('Failed to retrieve authentication tokens');
      }

      // Then fetch the accounts, passing the tokens directly
      const accountsResponse = await fetch(
        `/api/connections/accounts?service=${service}&accessToken=${encodeURIComponent(authData.access_token)}&refreshToken=${encodeURIComponent(authData.refresh_token)}`,
      );
      console.log('Accounts response:', accountsResponse);

      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.json();
        throw new Error(errorData.error || `Failed to fetch ${service} accounts`);
      }

      const accountsData = await accountsResponse.json();

      if (accountsData.success && accountsData.accounts && accountsData.accounts.length > 0) {
        setAccounts(accountsData.accounts);
        setShowAccountModal(true);
      } else {
        toast({
          title: 'No Accounts Found',
          variant: 'destructive',
          description: `No ${service} accounts found for this Google account.`,
        });
        setIsConnecting(null);
      }
    } catch (error) {
      console.error(`Error fetching accounts for ${service}:`, error);
      toast({
        title: 'Connection Failed',
        variant: 'destructive',
        description:
          error instanceof Error ? error.message : `Failed to retrieve accounts for ${service}`,
      });
      setIsConnecting(null);
    }
  };

  const handleAccountSelect = async (selection: AccountSelectionProps) => {
    if (!currentService || !authTokens.accessToken || !authTokens.refreshToken) return;

    // Use tokens instead of auth code
    const body = {
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      service: currentService,
      accountId: selection.accountId,
      propertyId: selection.propertyId || undefined,
    };

    console.log('Body:', body);
    try {
      const response = await fetch('/api/connections/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setConnections((prev) => ({
          ...prev,
          [currentService]: data.connection,
        }));

        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${currentService}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          variant: 'destructive',
          description: data.error || `Failed to connect to ${currentService}`,
        });
      }
    } catch (error) {
      console.error(`Error finalizing ${currentService} connection:`, error);
      toast({
        title: 'Connection Failed',
        variant: 'destructive',
        description:
          error instanceof Error ? error.message : `Failed to connect to ${currentService}`,
      });
    } finally {
      setShowAccountModal(false);
      setCurrentService(null);
      setAuthTokens({ accessToken: null, refreshToken: null });
      setIsConnecting(null);
    }
  };

  const getServiceScope = (service: string) => {
    switch (service) {
      case 'tagManager':
        return 'https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/tagmanager.edit.containers';
      case 'searchConsole':
        return 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/indexing';
      case 'analytics':
        return 'https://www.googleapis.com/auth/analytics.readonly';
      default:
        return '';
    }
  };

  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">Connections</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Connect your Google services to enhance your SEO capabilities.
        </p>
      </div>

      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {googleServices.map((service) => (
            <ConnectionButton
              key={service.id}
              disabled={isConnecting !== null}
              title={service.title}
              connecting={isConnecting === service.id}
              icon={service.icon}
              connected={!!connections[service.id as keyof typeof connections]}
              onClick={() => handleGoogleConnect(service.id)}
            />
          ))}
        </div>
      </div>

      {showAccountModal && currentService && (
        <AccountSelectionModal
          isOpen={showAccountModal}
          onClose={() => {
            setShowAccountModal(false);
            setIsConnecting(null);
          }}
          service={currentService}
          accounts={accounts}
          onAccountSelect={handleAccountSelect}
          accessToken={authTokens.accessToken || undefined}
          refreshToken={authTokens.refreshToken || undefined}
        />
      )}
    </div>
  );
}
