import {
  HomeIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  DocumentIcon,
  ArrowRightCircleIcon
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
    icon: SparklesIcon,
    items: [
      { name: 'Next Opportunity', href: '/opportunities', icon: ArrowRightCircleIcon },
      { name: 'Keyword Research', href: '/keyword-research', icon: MagnifyingGlassIcon },
      { name: 'Your Keywords', href: '/keyword-list', icon: ListBulletIcon }
    ]
  },
  {
    name: 'Content Management',
    href: '#',
    icon: DocumentTextIcon,
    items: [
      { name: 'Your Content', href: '/your-content', icon: DocumentIcon },
      { name: 'Content Orders', href: '/content-orders', icon: DocumentTextIcon },
    ]
  },
  {
    name: 'Analytics & Performance',
    href: '#',
    icon: ChartBarIcon,
    items: [
      { name: 'Keyword Rankings', href: '/rankings', icon: ArrowTrendingUpIcon },
      { name: 'Site Audit', href: '/site-audit', icon: ShieldExclamationIcon },
      { name: 'Competitors', href: '/competitors', icon: RocketLaunchIcon }
    ]
  },
  {
    name: 'Business Center',
    href: '#',
    icon: BuildingLibraryIcon,
    items: [
      { name: 'Your Business', href: '/business-information', icon: BuildingOfficeIcon },
    ]
  }
]
  