interface Country {
  code: string;
  name: string;
  languages: string[];
  locationCode: number;
}

// Prioritized countries at the top
export const priorityCountries: Country[] = [
    { code: 'US', name: 'United States', languages: ['en'], locationCode: 2840 },
    { code: 'GB', name: 'United Kingdom', languages: ['en'], locationCode: 2826 },
  ];
  
  // Rest of the countries
export const otherCountries: Country[] = [
    { code: 'AF', name: 'Afghanistan', languages: ['ps', 'fa'], locationCode: 2004 },
    { code: 'AL', name: 'Albania', languages: ['sq'], locationCode: 2008 },
    { code: 'DZ', name: 'Algeria', languages: ['ar'], locationCode: 2012 },
    { code: 'AR', name: 'Argentina', languages: ['es'], locationCode: 2032 },
    { code: 'AU', name: 'Australia', languages: ['en'], locationCode: 2036 },
    { code: 'AT', name: 'Austria', languages: ['de'], locationCode: 2040 },
    { code: 'BE', name: 'Belgium', languages: ['nl', 'fr', 'de'], locationCode: 2056 },
    { code: 'BR', name: 'Brazil', languages: ['pt'], locationCode: 2076 },
    { code: 'CA', name: 'Canada', languages: ['en', 'fr'], locationCode: 2124 },
    { code: 'CL', name: 'Chile', languages: ['es'], locationCode: 2152 },
    { code: 'CN', name: 'China', languages: ['zh'], locationCode: 2156 },
    { code: 'CO', name: 'Colombia', languages: ['es'], locationCode: 2170 },
    { code: 'CZ', name: 'Czech Republic', languages: ['cs'], locationCode: 2203 },
    { code: 'DK', name: 'Denmark', languages: ['da'], locationCode: 2208 },
    { code: 'EG', name: 'Egypt', languages: ['ar'], locationCode: 2818 },
    { code: 'FI', name: 'Finland', languages: ['fi'], locationCode: 2246 },
    { code: 'FR', name: 'France', languages: ['fr'], locationCode: 2250 },
    { code: 'DE', name: 'Germany', languages: ['de'], locationCode: 2276 },
    { code: 'GR', name: 'Greece', languages: ['el'], locationCode: 2300 },
    { code: 'HT', name: 'Haiti', languages: ['ht', 'fr'], locationCode: 2332 },
    { code: 'HK', name: 'Hong Kong', languages: ['zh', 'en'], locationCode: 2344 },
    { code: 'HU', name: 'Hungary', languages: ['hu'], locationCode: 2348 },
    { code: 'IN', name: 'India', languages: ['hi', 'en'], locationCode: 2356 },
    { code: 'ID', name: 'Indonesia', languages: ['id'], locationCode: 2360 },
    { code: 'IE', name: 'Ireland', languages: ['en', 'ga'], locationCode: 2372 },
    { code: 'IL', name: 'Israel', languages: ['he'], locationCode: 2376 },
    { code: 'IT', name: 'Italy', languages: ['it'], locationCode: 2380 },
    { code: 'JP', name: 'Japan', languages: ['ja'], locationCode: 2392 },
    { code: 'KR', name: 'South Korea', languages: ['ko'], locationCode: 2410 },
    { code: 'MY', name: 'Malaysia', languages: ['ms', 'en'], locationCode: 2458 },
    { code: 'MX', name: 'Mexico', languages: ['es'], locationCode: 2484 },
    { code: 'NL', name: 'Netherlands', languages: ['nl'], locationCode: 2528 },
    { code: 'NZ', name: 'New Zealand', languages: ['en'], locationCode: 2554 },
    { code: 'NO', name: 'Norway', languages: ['no'], locationCode: 2578 },
    { code: 'PK', name: 'Pakistan', languages: ['ur', 'en'], locationCode: 2586 },
    { code: 'PE', name: 'Peru', languages: ['es'], locationCode: 2604 },
    { code: 'PH', name: 'Philippines', languages: ['tl', 'en'], locationCode: 2608 },
    { code: 'PL', name: 'Poland', languages: ['pl'], locationCode: 2616 },
    { code: 'PT', name: 'Portugal', languages: ['pt'], locationCode: 2620 },
    { code: 'RO', name: 'Romania', languages: ['ro'], locationCode: 2642 },
    { code: 'RU', name: 'Russia', languages: ['ru'], locationCode: 2643 },
    { code: 'SA', name: 'Saudi Arabia', languages: ['ar'], locationCode: 2682 },
    { code: 'SG', name: 'Singapore', languages: ['en', 'zh', 'ms'], locationCode: 2702 },
    { code: 'ZA', name: 'South Africa', languages: ['en', 'af'], locationCode: 2710 },
    { code: 'ES', name: 'Spain', languages: ['es'], locationCode: 2724 },
    { code: 'SE', name: 'Sweden', languages: ['sv'], locationCode: 2752 },
    { code: 'CH', name: 'Switzerland', languages: ['de', 'fr', 'it'], locationCode: 2756 },
    { code: 'TW', name: 'Taiwan', languages: ['zh'], locationCode: 2158 },
    { code: 'TH', name: 'Thailand', languages: ['th'], locationCode: 2764 },
    { code: 'TR', name: 'Turkey', languages: ['tr'], locationCode: 2792 },
    { code: 'AE', name: 'United Arab Emirates', languages: ['ar', 'en'], locationCode: 2784 },
    { code: 'VN', name: 'Vietnam', languages: ['vi'], locationCode: 2704 },
  ].sort((a, b) => a.name.localeCompare(b.name));

// Helper function to get location code by country code
export const getLocationCodeByCountry = (countryCode: string): number => {
  const country = [...priorityCountries, ...otherCountries].find(c => c.code === countryCode);
  return country?.locationCode || 2826; // Default to UK if not found
};