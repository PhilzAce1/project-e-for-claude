'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Website {
  id: any;
  name: any;
  domain: any;
  agency_id: any;
}

interface WebsiteContextType {
  currentWebsite: Website | null;
  setCurrentWebsite: (website: Website | null) => void;
  websites: Website[];
  loadWebsites: () => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const [currentWebsite, setCurrentWebsiteState] = useState<Website | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const setCurrentWebsite = async (website: Website | null) => {
    setCurrentWebsiteState(website);
    if (website) {
      await supabase.auth.updateUser({
        data: { selected_business_id: website.id }
      });
      router.refresh();
    }
  };

  const loadWebsites = async () => {
    setIsLoading(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Get websites where user is the direct owner
    const { data: ownedWebsites } = await supabase
      .from('business_information')
      .select('id,  domain, agency_id')
      .eq('user_id', userId);

    // First get the agencies owned by the user
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', userId);

    // Then get all websites belonging to those agencies
    const { data: agencyWebsites } = await supabase
      .from('business_information')
      .select('*')
      .in('agency_id', agencies?.map(agency => agency.id) || []);
      // .eq('agency_id', agencies?.[0]?.id)

    const websiteList = [
      ...(ownedWebsites || []),
      ...(agencyWebsites || [])
    ].filter((website): website is Website => 
      website && typeof website === 'object' && 'id' in website
    );
    
    // Remove duplicates
    const uniqueWebsites = Array.from(new Map(websiteList.map(item => [item.id, item])).values());
    setWebsites(uniqueWebsites);

    // Get saved website from localStorage
    const savedWebsiteStr = localStorage.getItem('currentWebsite');
    let savedWebsite = null;
    if (savedWebsiteStr) {
      try {
        savedWebsite = JSON.parse(savedWebsiteStr);
      } catch (e) {
        console.error('Error parsing saved website:', e);
      }
    }

    // If we have a saved website and it exists in our loaded websites, use it
    if (savedWebsite) {
      const websiteStillExists = uniqueWebsites.some(w => w.id === savedWebsite.id);
      if (websiteStillExists) {
        const currentWebsite = uniqueWebsites.find(w => w.id === savedWebsite.id);
        setCurrentWebsite(currentWebsite || null);
      } else {
        // If saved website no longer exists, clear it
        localStorage.removeItem('currentWebsite');
        setCurrentWebsite(uniqueWebsites[0] || null);
      }
    } else if (uniqueWebsites.length > 0) {
      // If no saved website, use the first one
      setCurrentWebsite(uniqueWebsites[0]);
    }

    setIsLoading(false);
  };

  // Load websites on mount
  useEffect(() => {
    loadWebsites();
  }, []);

  // Save current website to localStorage whenever it changes
  useEffect(() => {
    if (currentWebsite && !isLoading) {
      localStorage.setItem('currentWebsite', JSON.stringify(currentWebsite));
    }
  }, [currentWebsite, isLoading]);

  return (
    <WebsiteContext.Provider value={{ currentWebsite, setCurrentWebsite, websites, loadWebsites }}>
      {children}
    </WebsiteContext.Provider>
  );
}

export function useWebsite() {
  const context = useContext(WebsiteContext);
  if (context === undefined) {
    throw new Error('useWebsite must be used within a WebsiteProvider');
  }
  return context;
}

export function useWebsiteData() {
  const { currentWebsite } = useWebsite();
  const supabase = createClientComponentClient();

  const fetchSEOCrawls = async () => {
    if (!currentWebsite) return null;
    const { data } = await supabase
      .from('seo_crawls')
      .select('*')
      .eq('business_id', currentWebsite.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  };

  const fetchBusinessAnalyses = async () => {
    if (!currentWebsite) return null;
    const { data } = await supabase
      .from('business_analyses')
      .select('*')
      .eq('business_id', currentWebsite.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  };

  return {
    fetchSEOCrawls,
    fetchBusinessAnalyses,
  };
} 