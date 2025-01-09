#!/bin/bash

# Array of URLs
urls=(
  "https://playfootball.games/football-bingo/"
  "https://playfootball.games/football-connections/"
  "https://playfootball.games/football-wordle/"
  "https://playfootball.games/quizzes/"
  "https://www.fourfourtwo.com/football-quiz-quizzes"
  "https://www.bbc.co.uk/sport/football-quizzes"
  "https://www.sporcle.com/games/subcategory/football"
  "https://www.theguardian.com/football/2025/jan/08/football-quiz-in-which-minute-were-these-iconic-goals-scored"
  "https://www.bbc.com/sport/football/articles/czd468v5zego"
  "https://www.football365.com/news/football-quiz-missing-men-league-cup-carabao-liverpool-2-1-spurs-tottenham-2016"
  "https://www.fourfourtwo.com/features/football-quiz-can-you-name-every-club-to-have-ever-reached-the-league-cup-semi-finals"
  "https://www.howto.co.uk/titles/nick-holt/the-mammoth-football-quiz-book/9781472137630"
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