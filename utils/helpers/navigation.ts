import {
    HomeIcon,
    ShieldExclamationIcon,
    ArrowTrendingUpIcon,
    RocketLaunchIcon
  } from '@heroicons/react/24/outline'
  
  export const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon},
    { name: 'Keyword Rankings', href: '/rankings', icon: ArrowTrendingUpIcon},
    { name: 'Site Audit', href: '/site-audit', icon: ShieldExclamationIcon},
    { name: 'Competitors', href: '/competitors', icon: RocketLaunchIcon},
  ]
  