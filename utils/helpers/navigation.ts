import {
  HomeIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  items?: NavigationItem[];
}

export const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon 
  },
  { 
    name: 'Opportunities', 
    href: '/opportunities', 
    icon: SparklesIcon 
  },
  {
    name: 'Content Management',
    href: '#',
    icon: DocumentTextIcon,
    items: [
      { name: 'Your Content', href: '/your-content', icon: DocumentDuplicateIcon },
      { name: 'Content Orders', href: '/content-orders', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Analytics & Performance',
    href: '#',
    icon: ChartBarIcon,
    items: [
      { name: 'Keyword Rankings', href: '/rankings', icon: ArrowTrendingUpIcon },
      { name: 'Site Audit', href: '/site-audit', icon: ShieldExclamationIcon }
    ]
  },
  {
    name: 'Business Center',
    href: '#',
    icon: BuildingLibraryIcon,
    items: [
      { name: 'Your Business', href: '/business-information', icon: BuildingOfficeIcon },
      { name: 'Competitors', href: '/competitors', icon: RocketLaunchIcon }
    ]
  }
]
  