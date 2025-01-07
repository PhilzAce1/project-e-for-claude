'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition, Disclosure } from '@headlessui/react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import Logo from '@/components/icons/Logo';
import { navigation } from '@/utils/helpers/navigation';
import { classNames } from '@/utils/helpers';

interface SidebarProps {
  user: any;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ user, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  // Function to check if the current path is active
  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  // Function to check if any child item is active
  const hasActiveChild = (items: any[]) => {
    return items?.some(item => isActivePath(item.href));
  };

  const NavItem = ({ item }: { item: any }) => {
    if (item.items) {
      return (
        <Disclosure as="div" defaultOpen={hasActiveChild(item.items)}>
          {({ open }) => (
            <>
              <Disclosure.Button
                className={classNames(
                  hasActiveChild(item.items) ? 'bg-gray-50 text-orange-600' : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50',
                  'flex items-center w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold cursor-pointer'
                )}
              >
                <item.icon
                  className={classNames(
                    hasActiveChild(item.items) ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600',
                    'h-6 w-6 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
                <ChevronRightIcon
                  className={classNames(
                    open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                    'ml-auto h-5 w-5 shrink-0 transition-transform duration-200'
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              <Disclosure.Panel className="mt-1 px-2">
                <ul role="list" className="space-y-1">
                  {item.items.map((subItem: any) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.href}
                        className={classNames(
                          isActivePath(subItem.href)
                            ? 'bg-gray-50 text-orange-600'
                            : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold pl-6'
                        )}
                      >
                        <subItem.icon
                          className={classNames(
                            isActivePath(subItem.href) ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      );
    }

    return (
      <Link
        href={item.href}
        className={classNames(
          isActivePath(item.href)
            ? 'bg-gray-50 text-orange-600'
            : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50',
          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
        )}
      >
        <item.icon
          className={classNames(
            isActivePath(item.href) ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600',
            'h-6 w-6 shrink-0'
          )}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex mt-8 shrink-0 items-center">
                    <Logo className="h-16 w-auto" />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <NavItem item={item} />
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="-mx-6 mt-auto">
                        <Link
                          href="/account"
                          className={classNames(
                            'flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6',
                            isActivePath('/account')
                              ? 'bg-gray-50 text-orange-600'
                              : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                          )}
                        >
                          <img
                            className="h-8 w-8 rounded-full bg-gray-50"
                            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || user?.email || 'User'}`}
                            alt=""
                          />
                          <span aria-hidden="true">{user.user_metadata?.full_name || user?.email || 'User'}</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex mt-8 h-16 shrink-0 items-center">
            <Logo className="h-16 w-auto" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavItem item={item} />
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  href="/account"
                  className={classNames(
                    'flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 rounded-md',
                    isActivePath('/account')
                      ? 'bg-gray-50 text-orange-600'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  )}
                >
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || user?.email || 'User'}`}
                    alt=""
                  />
                  <span aria-hidden="true">{user.user_metadata?.full_name || user?.email || 'User'}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}