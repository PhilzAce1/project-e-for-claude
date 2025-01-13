export function sanitizeUrl(url: string): string {
  // Ensure URL has protocol
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  // Encode URL properly
  try {
    return new URL(url).toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}