'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Button } from '@headlessui/react';

export interface GoogleAccount {
  id?: string;
  accountId?: string;
  name?: string;
  displayName?: string;
  [key: string]: any;
}

export interface GoogleProperty {
  id?: string;
  propertyId?: string;
  containerId?: string;
  name?: string;
  displayName?: string;
  siteUrl?: string;
  [key: string]: any;
}

export interface AccountSelectionProps {
  accountId: string;
  propertyId?: string;
}

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string;
  accounts: GoogleAccount[];
  onAccountSelect: (selection: AccountSelectionProps) => void;
  accessToken?: string;
  refreshToken?: string;
}

export default function AccountSelectionModal({
  isOpen,
  onClose,
  service,
  accounts,
  onAccountSelect,
  accessToken,
  refreshToken,
}: AccountSelectionModalProps): JSX.Element {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [properties, setProperties] = useState<GoogleProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const firstAccountId = accounts[0].id || accounts[0].accountId || '';
      setSelectedAccount(firstAccountId);
    }
  }, [accounts]);

  useEffect(() => {
    if (selectedAccount) {
      fetchProperties();
    }
  }, [selectedAccount, service]);

  const fetchProperties = async (): Promise<void> => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      let url = `/api/connections/properties?service=${service}&accountId=${selectedAccount}`;

      // Add tokens if provided
      if (accessToken && refreshToken) {
        url += `&accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties || []);
        if (data.properties && data.properties.length > 0) {
          const firstPropertyId =
            data.properties[0].id ||
            data.properties[0].propertyId ||
            data.properties[0].containerId ||
            '';
          setSelectedProperty(firstPropertyId);
        } else {
          setSelectedProperty('');
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedAccount) return;

    setSubmitting(true);
    try {
      onAccountSelect({
        accountId: selectedAccount,
        propertyId: selectedProperty || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getServicePropertyLabel = (): string => {
    switch (service) {
      case 'tagManager':
        return 'Container';
      case 'searchConsole':
        return 'Site';
      case 'analytics':
        return 'Property';
      default:
        return 'Property';
    }
  };

  const getAccountName = (account: GoogleAccount): string => {
    return account.name || account.displayName || account.id || account.accountId || '';
  };

  const getPropertyName = (property: GoogleProperty): string => {
    return (
      property.name ||
      property.displayName ||
      property.siteUrl ||
      (property.id || property.propertyId || property.containerId || '').toString()
    );
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(e.target.value);
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProperty(e.target.value);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Select {service} Account
                </Dialog.Title>

                <div className="mt-4 space-y-6">
                  <div>
                    <label
                      htmlFor="account-select"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Account
                    </label>
                    <select
                      id="account-select"
                      value={selectedAccount}
                      onChange={handleAccountChange}
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                    >
                      {accounts.map((account, index) => (
                        <option
                          key={account.id || account.accountId || index}
                          value={account.id || account.accountId}
                        >
                          {getAccountName(account)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {properties.length > 0 && (
                    <div>
                      <label
                        htmlFor="property-select"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {getServicePropertyLabel()}
                      </label>
                      <select
                        id="property-select"
                        value={selectedProperty}
                        onChange={handlePropertyChange}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                      >
                        {properties.map((property) => (
                          <option
                            key={property.id || property.propertyId || property.containerId}
                            value={property.id || property.propertyId || property.containerId}
                          >
                            {getPropertyName(property)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  )}

                  {submitting && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">Submitting...</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={loading || submitting || !selectedAccount}
                  >
                    Connect
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
