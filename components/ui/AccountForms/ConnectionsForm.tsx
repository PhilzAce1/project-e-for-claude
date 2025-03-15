'use client';

import { useState, useEffect } from 'react';
import {
  GoogleTagManager,
  GoogleSearchConsole,
  GoogleAnalytics
} from '@/components/icons/Google';
import { toast } from '../Toasts/use-toast';

// Add Google OAuth types
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
  onClick
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
      {connecting && (
        <span className="text-xs text-gray-500 mt-1">Connecting...</span>
      )}
      {connected && !connecting && (
        <span className="text-xs text-green-600 mt-1">Connected</span>
      )}
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
    icon: <GoogleTagManager className="w-8 h-8 mb-2" />
  },
  {
    id: 'searchConsole',
    title: 'Search Console',
    icon: <GoogleSearchConsole className="w-11 h-11 mb-2" />
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <GoogleAnalytics className="w-8 h-8 mb-2" />
  }
];

export default function ConnectionsForm() {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<{
    searchConsole: any | null;
    tagManager: any | null;
    analytics: any | null;
  }>({
    searchConsole: null,
    tagManager: null,
    analytics: null
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
      const response = await fetch('/api/connections');
      const data = await response.json();

      if (data.success) {
        setConnections(data.connections);
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
            exchangeCodeForToken(
              response.code,
              service,
              window.location.origin
            );
          } else if (response.error) {
            console.error('Google OAuth error:', response.error);
            alert(`Failed to connect to ${service}: ${response.error}`);
            setIsConnecting(null);
          }
        }
      });

      client.requestCode();
    } catch (error) {
      console.error(`Error initiating ${service} OAuth:`, error);
      alert(
        error instanceof Error ? error.message : 'Failed to connect to service'
      );
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

  const exchangeCodeForToken = async (
    code: string,
    service: string,
    redirect_uri: string
  ) => {
    try {
      const response = await fetch('/api/connections/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          service,
          redirect_uri
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Connection Failed',
          variant: 'destructive',
          description: `Failed to connect to ${service}`
        });
      }

      if (data.success) {
        setConnections((prev) => ({
          ...prev,
          [service]: true
        }));
        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${service}`
        });
      } else {
        toast({
          title: 'Connection Failed',
          variant: 'destructive',
          description: `Failed to connect to ${service}`
        });
      }
    } catch (error) {
      console.error(`Error exchanging code for ${service}:`, error);
      toast({
        title: 'Connection Failed',
        variant: 'destructive',
        description: `Failed to connect to ${service}`
      });
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">
          Connections
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Connect your Google services to enhance your SEO capabilities.
        </p>
      </div>

      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {googleServices.map((service) => {
            return (
              <ConnectionButton
                key={service.id}
                disabled={isConnecting === service.id}
                title={service.title}
                connecting={
                  isConnecting === service.id &&
                  connections[service.id as keyof typeof connections] === null
                }
                icon={service.icon}
                connected={
                  !!connections[service.id as keyof typeof connections]
                }
                onClick={() => handleGoogleConnect(service.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
