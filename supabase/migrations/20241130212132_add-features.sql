alter table products 
    add column features jsonb not null default '[]'::jsonb;
