#!/bin/bash

# Array of URLs
urls=(
  "https://support.trustpilot.com/hc/da/articles/360019826379-Oversigt-over-Trustpilots-TrustBox-widgets",
  "https://support.trustpilot.com/hc/en-us/articles/360019826379-TrustBox-widget-overview",
  "https://business.trustpilot.com/features/trustbox-widgets",
  "https://dk.business.trustpilot.com/features/trustbox-widgets",
  "https://support.trustpilot.com/hc/en-us/articles/203840826-Add-a-service-review-TrustBox-widget",
  "https://support.trustpilot.com/hc/da/articles/203840826-S%C3%A5dan-tilf%C3%B8jer-du-en-TrustBox-widget-med-serviceanmeldelser",
  "https://support.trustpilot.com/hc/da/articles/360035128794-Hvad-er-en-TrustBox-widget",
  "https://support.trustpilot.com/hc/en-us/articles/201765546-TrustBox-widgets-FAQ",
  "https://support.trustpilot.com/hc/en-us/articles/360019539940-Add-a-product-review-TrustBox-widget"
)

# Create directory for output if it doesn't exist
mkdir -p scraped_content

# First, make sure lynx is installed
if ! command -v lynx &> /dev/null; then
    echo "lynx is not installed. Installing..."
    brew install lynx || sudo apt-get install lynx || sudo yum install lynx
fi

# Loop through URLs and download content
for url in "${urls[@]}"
do
  # Extract filename from URL (replace special characters with underscore)
  filename=$(echo "$url" | sed 's/[^a-zA-Z0-9]/_/g').txt
  
  echo "Scraping $url..."
  
  # Use curl to download and pipe to lynx for text extraction
  # -dump shows the content
  # -listonly shows just the links
  # We'll combine both outputs
  curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
       -L \
       "$url" | lynx -dump -stdin > "scraped_content/$filename"
  
  # Wait 2 seconds between requests to be nice to servers
  sleep 2
done

echo "Scraping complete! Check the scraped_content directory."