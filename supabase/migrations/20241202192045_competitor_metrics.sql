alter table business_information
add column competitor_metrics jsonb default '{
  "total_keywords": 0,
  "average_keywords": 0,
  "total_opportunities": 0,
  "competitor_count": 0,
  "last_updated": null
}'::jsonb;
