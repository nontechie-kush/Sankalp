update public.rituals
set starting_price_minor = 14900,
    updated_at = now()
where status = 'active';

update public.mweb_ritual_use_cases
set price_minor = 14900,
    currency = 'INR',
    updated_at = now()
where status = 'active';
