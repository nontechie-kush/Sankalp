insert into public.rituals (
  id,
  title,
  slug,
  subtitle,
  short_description,
  description,
  duration_minutes,
  starting_price_minor,
  currency,
  status,
  is_trending,
  trending_rank,
  supported_modes,
  deliverables
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Dhan Aagman',
    'dhanAagman',
    'Prosperity blessing',
    'Bless money, business, career, and new-venture moments with an auspicious start.',
    'A pandit performs Lakshmi-Kuber puja in your name with kalash sthapana, mantra japa, and aarti at a prosperous muhurat.',
    30,
    14900,
    'INR',
    'active',
    true,
    3,
    array['digital_fulfilment'],
    array['Pandit performed ritual', 'Video confirmation', 'Completion update']
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Prem Setu',
    'premSetu',
    'Relationship harmony',
    'A ritual for love, courage, harmony, and emotional clarity in relationships.',
    'A pandit invokes blessings for love and harmony in your name, with mantra and offerings dedicated to your intention.',
    30,
    14900,
    'INR',
    'active',
    true,
    4,
    array['digital_fulfilment'],
    array['Pandit performed ritual', 'Video confirmation', 'Completion update']
  )
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  short_description = excluded.short_description,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  starting_price_minor = excluded.starting_price_minor,
  currency = excluded.currency,
  status = excluded.status,
  is_trending = excluded.is_trending,
  trending_rank = excluded.trending_rank,
  supported_modes = excluded.supported_modes,
  deliverables = excluded.deliverables,
  updated_at = now();

with use_case_catalog (
  seed_id,
  ritual_slug,
  group_label,
  icon_name,
  title,
  subtitle,
  price_minor,
  currency,
  is_popular,
  display_order,
  status
) as (
  values
    ('c38119f9-75e4-4855-8a1e-55cce96fc324'::uuid, 'examBlessings', 'Career & money', 'briefcase', 'New job', 'Start the new chapter protected', 14900, 'INR', false, 1, 'active'),
    ('d91893b2-b6b8-49c6-8659-528413fae5e7'::uuid, 'examBlessings', 'Career & money', 'door', 'First day at work', 'Walk in on the right foot', 14900, 'INR', true, 2, 'active'),
    ('e7432218-b1f7-4bff-a713-c11c79a07808'::uuid, 'examBlessings', 'Career & money', 'meeting', 'Big meeting', 'Protection before the room', 14900, 'INR', false, 3, 'active'),
    ('d1902973-cae1-4211-8f9a-ed4ee49a4a75'::uuid, 'examBlessings', 'Career & money', 'chat', 'Job interview', 'Steady nerves, clear head', 14900, 'INR', true, 4, 'active'),
    ('aa86ca6f-3d86-4e1e-8739-7f5aa4f3dca5'::uuid, 'examBlessings', 'Exams & study', 'pencil', 'Exam day', 'Calm focus when it counts', 14900, 'INR', true, 5, 'active'),
    ('3b815ab6-2c5b-4474-abcc-0fa3b8015d9a'::uuid, 'examBlessings', 'Exams & study', 'trophy', 'Results day', 'Hold your nerve for the news', 14900, 'INR', false, 6, 'active'),
    ('872f0a5f-e789-433d-8bff-ebd09b8bdc2c'::uuid, 'examBlessings', 'Travel & big days', 'plane', 'Flight / travel', 'Safe passage, there and back', 14900, 'INR', true, 7, 'active'),
    ('77f962bd-f9ec-448d-abc7-8292d3bdf468'::uuid, 'examBlessings', 'Travel & big days', 'health', 'Surgery / health', 'A shield through the procedure', 14900, 'INR', false, 8, 'active'),
    ('37b66848-174c-4386-b018-de69038d46f6'::uuid, 'examBlessings', 'Travel & big days', 'home', 'New home', 'Bless and protect the move', 14900, 'INR', false, 9, 'active'),

    ('2f00f0ae-de3f-41df-94f2-acce6d52a90e'::uuid, 'dhanAagman', 'Career & deals', 'invest', 'Big deal or pitch', 'Tip the odds your way', 14900, 'INR', true, 1, 'active'),
    ('522adc5d-d633-4128-819c-9c0158dbe2f0'::uuid, 'dhanAagman', 'Career & deals', 'chat', 'Job interview', 'Walk in with the blessings', 14900, 'INR', true, 2, 'active'),
    ('a60a9dd5-ce8a-44cf-b552-67ed7eb12dfc'::uuid, 'dhanAagman', 'Career & deals', 'tag', 'Salary or promotion', 'Ask from a place of fortune', 14900, 'INR', false, 3, 'active'),
    ('b107b7e2-3383-49e0-851f-67bd800065aa'::uuid, 'dhanAagman', 'Career & deals', 'shop', 'New shop / business', 'Open the doors with blessings', 14900, 'INR', false, 4, 'active'),
    ('313fb999-fc6c-4e75-bf10-1cf14d3e6061'::uuid, 'dhanAagman', 'Big buys & ventures', 'rocket', 'New venture / startup', 'Bless the launch', 14900, 'INR', true, 5, 'active'),
    ('14ea562d-b97f-4226-a1be-4ae33b29e0c5'::uuid, 'dhanAagman', 'Big buys & ventures', 'building', 'Property deal', 'Seal it with prosperity', 14900, 'INR', false, 6, 'active'),
    ('d3c1dd3b-670f-4880-a287-cd1088a4d486'::uuid, 'dhanAagman', 'Big buys & ventures', 'car', 'New vehicle', 'Auspicious first drive', 14900, 'INR', false, 7, 'active'),
    ('c72e291e-3976-4d43-aa5c-3b80999dadeb'::uuid, 'dhanAagman', 'Big buys & ventures', 'cash', 'Investment / trade', 'Enter the market with clarity', 14900, 'INR', false, 8, 'active'),

    ('8041aee3-0832-40d9-a53e-84d59ae20000'::uuid, 'premSetu', 'Expressing love', 'heart', 'Confess your feelings', 'Find the nerve to say it', 14900, 'INR', true, 1, 'active'),
    ('e909337e-a2f6-4356-801b-fdf21e56c82f'::uuid, 'premSetu', 'Expressing love', 'ring', 'Before you propose', 'Bless the big question', 14900, 'INR', true, 2, 'active'),
    ('27bf49dd-8921-4858-89ff-8d758c1e5708'::uuid, 'premSetu', 'Expressing love', 'star', 'Anniversary', 'Renew the connection', 14900, 'INR', false, 3, 'active'),
    ('df0c6ee7-e6cd-4fd7-b192-6d427e1644d6'::uuid, 'premSetu', 'Expressing love', 'users', 'Long distance bond', 'Keep the connection strong', 14900, 'INR', false, 4, 'active'),
    ('277258f8-c475-4fa0-b6c2-9fe8592fcd8a'::uuid, 'premSetu', 'Mending & healing', 'bandage', 'Patch a fight', 'Mend a strained bond', 14900, 'INR', true, 5, 'active'),
    ('72538925-6932-41d5-a0b2-994ac59177c1'::uuid, 'premSetu', 'Mending & healing', 'door', 'Win them back', 'Reopen the door gently', 14900, 'INR', false, 6, 'active'),
    ('afe6b34a-040f-4a54-9a1f-1cc86d783beb'::uuid, 'premSetu', 'Mending & healing', 'homeheart', 'Family harmony', 'Bring peace back to the home', 14900, 'INR', false, 7, 'active'),
    ('3f05ce17-73d9-4ec4-86b9-c88eefdb5a6b'::uuid, 'premSetu', 'Mending & healing', 'diamond', 'Marriage / shaadi', 'Bless the union before the day', 14900, 'INR', false, 8, 'active'),

    ('d0696612-5478-48d1-b09f-a839138dae1e'::uuid, 'nazarUttaro', 'Clearing the nazar', 'trenddown', 'A losing streak', 'Break the run of bad luck', 14900, 'INR', true, 1, 'active'),
    ('9d77aa55-0c10-4cc7-b98a-f95d95274100'::uuid, 'nazarUttaro', 'Clearing the nazar', 'car', 'New vehicle', 'Remove envy before the first drive', 14900, 'INR', false, 2, 'active'),
    ('42d0a4b1-fe4d-4b02-9cb7-7fa007032bf9'::uuid, 'nazarUttaro', 'Clearing the nazar', 'shop', 'Business / home nazar', 'Protect what you''ve built', 14900, 'INR', true, 3, 'active'),
    ('d4354ccd-276f-47a9-a281-a292d1b61f4e'::uuid, 'nazarUttaro', 'Clearing the nazar', 'health', 'Health / family', 'Clear heavy energy from loved ones', 14900, 'INR', false, 4, 'active'),
    ('45ee8e62-d0d4-4495-b174-fa7376c36b11'::uuid, 'nazarUttaro', 'Clearing the nazar', 'mood', 'Feeling off lately', 'Reset when nothing feels right', 14900, 'INR', true, 5, 'active')
),
resolved_use_cases as (
  select
    catalog.seed_id,
    ritual.id as ritual_id,
    catalog.group_label,
    catalog.icon_name,
    catalog.title,
    catalog.subtitle,
    catalog.price_minor,
    catalog.currency,
    catalog.is_popular,
    catalog.display_order,
    catalog.status
  from use_case_catalog catalog
  join public.rituals ritual on ritual.slug = catalog.ritual_slug
),
updated_use_cases as (
  update public.mweb_ritual_use_cases existing
  set title = resolved.title,
      group_label = resolved.group_label,
      icon_name = resolved.icon_name,
      subtitle = resolved.subtitle,
      price_minor = resolved.price_minor,
      currency = resolved.currency,
      is_popular = resolved.is_popular,
      display_order = resolved.display_order,
      status = resolved.status,
      updated_at = now()
  from resolved_use_cases resolved
  where existing.ritual_id = resolved.ritual_id
    and lower(trim(existing.title)) = lower(trim(resolved.title))
  returning existing.id
)
insert into public.mweb_ritual_use_cases (
  id,
  ritual_id,
  group_label,
  icon_name,
  title,
  subtitle,
  price_minor,
  currency,
  is_popular,
  display_order,
  status
)
select
  resolved.seed_id,
  resolved.ritual_id,
  resolved.group_label,
  resolved.icon_name,
  resolved.title,
  resolved.subtitle,
  resolved.price_minor,
  resolved.currency,
  resolved.is_popular,
  resolved.display_order,
  resolved.status
from resolved_use_cases resolved
where not exists (
  select 1
  from public.mweb_ritual_use_cases existing
  where existing.ritual_id = resolved.ritual_id
    and lower(trim(existing.title)) = lower(trim(resolved.title))
);
