'use client';

import { useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import { Bars3Icon } from '@heroicons/react/24/outline'
import Logo from '@/components/icons/Logo'
import { User } from '@supabase/supabase-js'

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  user: User;
  userDetails: any; // Replace 'any' with a more specific type if available
}

export default function AuthenticatedLayout({ children, user, userDetails }: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} userDetails={userDetails} />

      <div className="lg:pl-72">
        {/* Sticky header for mobile only */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 flex justify-center">
            <Logo className="h-8 w-auto" />
          </div>
          
          {/* User name or avatar could go here for mobile */}
          <div className="w-6" />
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}