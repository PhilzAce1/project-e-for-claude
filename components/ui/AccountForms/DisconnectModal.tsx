import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@headlessui/react';
import { useState } from 'react';

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string;
  onDisconnect: () => void;
}

export default function DisconnectModal({
  isOpen,
  onClose,
  service,
  onDisconnect,
}: DisconnectModalProps) {
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
                  Disconnect {service}
                </Dialog.Title>
                <div className="mt-4">
                  <p>Are you sure you want to disconnect from {service}?</p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none disabled:opacity-50"
                    onClick={onDisconnect}
                  >
                    Disconnect
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
