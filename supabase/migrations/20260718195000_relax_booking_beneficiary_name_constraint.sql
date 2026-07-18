alter table public.mweb_bookings
  alter column beneficiary_name drop not null;

update public.mweb_bookings booking
set beneficiary_name = coalesce(
      nullif(trim(booking.beneficiary_name), ''),
      nullif(trim(booking.customer_name), ''),
      'Sankalp customer'
    )
where booking.beneficiary_name is null
   or trim(booking.beneficiary_name) = '';

notify pgrst, 'reload schema';
