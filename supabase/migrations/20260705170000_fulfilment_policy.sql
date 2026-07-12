insert into public.faqs (id, question, answer, category, display_order, status)
values (
  '75b43f90-da2d-4ac4-95f9-a8eefc263f55',
  'When will my ritual be performed?',
  'Book before 2 PM for same-day performance, unless the day is inauspicious. Bookings made later, or on an inauspicious day, are performed by the next day.',
  'mweb',
  9,
  'active'
)
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

update public.faqs
set answer = 'Choose the moment and ritual, verify your phone, and complete payment. We schedule the auspicious performance and handle pandit assignment for you.',
    updated_at = now()
where id = 'db06d0e4-edf8-4ed6-ba56-2d3d0e2ca910';
