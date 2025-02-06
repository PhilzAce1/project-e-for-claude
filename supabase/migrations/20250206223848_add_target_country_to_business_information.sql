-- Add target_country column to business_information table
alter table business_information 
add column if not exists target_country text;

-- Add index for faster lookups
create index if not exists business_information_target_country_idx 
on business_information(target_country); 
