import {
    HomeIcon,
    ShieldExclamationIcon,
    ArrowTrendingUpIcon,
    RocketLaunchIcon,
    BuildingOfficeIcon,
    SparklesIcon,
    DocumentTextIcon
  } from '@heroicons/react/24/outline'
  
  export const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon},
    { name: 'Opportunities', href: '/opportunities', icon: SparklesIcon},
    { name: 'Content Orders', href: '/content-orders', icon: DocumentTextIcon},
    { name: 'Your Business', href: '/business-information', icon: BuildingOfficeIcon},
    { name: 'Keyword Rankings', href: '/rankings', icon: ArrowTrendingUpIcon},
    { name: 'Site Audit', href: '/site-audit', icon: ShieldExclamationIcon},
    { name: 'Competitors', href: '/competitors', icon: RocketLaunchIcon},
  ]
  