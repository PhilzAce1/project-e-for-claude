#!/bin/bash

# Configuration
API_ENDPOINT="https://app.espy-go.com/api/init-seo-crawl"
RATE_LIMIT=2000  # calls per minute
SLEEP_TIME=$(bc <<< "scale=3; 60/$RATE_LIMIT")  # time to sleep between calls in seconds
COUNTER=0
MINUTE_START=$(date +%s)

# Function to make API call
make_api_call() {
    local user_id=$1
    local domain=$2
    
    # Sanitize inputs and create JSON payload
    local sanitized_user_id=$(echo "$user_id" | sed 's/[^a-zA-Z0-9-]//g')
    local sanitized_domain=$(echo "$domain" | sed 's/[^a-zA-Z0-9.-]//g')
    
    local json_payload="{\"userId\":\"$sanitized_user_id\",\"domain\":\"$sanitized_domain\",\"createBusiness\":false}"
    
    # Make the API call
    echo "Sending request with payload: $json_payload"
    curl -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$json_payload" \
        --fail \
        || echo "Failed to process: $user_id - $domain"
    
    echo "" # Add newline after curl output
    
    # Increment counter
    ((COUNTER++))
    
    # Check rate limit
    CURRENT_TIME=$(date +%s)
    if [ $((CURRENT_TIME - MINUTE_START)) -ge 60 ]; then
        echo "Resetting counter - New minute"
        COUNTER=0
        MINUTE_START=$CURRENT_TIME
    elif [ $COUNTER -ge $RATE_LIMIT ]; then
        echo "Rate limit reached - Waiting for next minute"
        sleep $((60 - (CURRENT_TIME - MINUTE_START)))
        COUNTER=0
        MINUTE_START=$CURRENT_TIME
    else
        # Sleep between requests
        sleep $SLEEP_TIME
    fi
}

# Check if CSV file is provided
if [ -z "$1" ]; then
    echo "Please provide the path to the CSV file"
    echo "Usage: $0 <path-to-csv>"
    exit 1
fi

# First, let's see what's in the CSV
echo "First few lines of the CSV file:"
head -n 5 "$1"

# Process CSV file line by line
while IFS=, read -r col_a user_id domain rest; do
    # Skip header if present
    if [[ "$user_id" == "user_id" ]] || [[ "$user_id" == "\"user_id\"" ]]; then
        echo "Skipping header row"
        continue
    fi
    
    # Remove quotes and whitespace
    user_id=$(echo "$user_id" | tr -d '"' | xargs)
    domain=$(echo "$domain" | tr -d '"' | xargs)
    
    # Skip empty lines
    if [ -z "$user_id" ] || [ -z "$domain" ]; then
        echo "Skipping empty line"
        continue
    fi
    
    echo "Processing: $user_id - $domain"
    make_api_call "$user_id" "$domain"
done < "$1"

echo "Processing complete" 