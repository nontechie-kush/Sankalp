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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Live Sankalp Blessing',
    'videoBlessing',
    'Live video ritual',
    'Join pandit ji live when you want to participate directly from home.',
    'Sit with pandit ji from home - calm guidance when distance matters.',
    45,
    25100,
    'INR',
    'active',
    true,
    1,
    array['live_video'],
    array['Live guided ritual', 'Preparation checklist', 'Video call joining link']
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Nazar Badha',
    'nazarUttaro',
    'Clear the evil eye',
    'Clear heavy energy, bad luck streaks, or the evil eye after a good run.',
    'A protective clearing - gentle words and ritual focus for your household.',
    45,
    19900,
    'INR',
    'active',
    true,
    2,
    array['live_video'],
    array['Live guided ritual', 'Preparation checklist', 'Post-ritual care notes']
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Griha pravesh',
    'grihaPravesh',
    'Home entry pooja',
    'Auspicious rituals for entering a new home with family.',
    'Bless the threshold - auspicious entry rites tailored to your new space.',
    90,
    510000,
    'INR',
    'active',
    true,
    3,
    array['live_video', 'home_visit'],
    array['Muhurat guidance', 'Preparation checklist', 'Live ritual support']
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Home havan',
    'homeHavan',
    'Guided family havan',
    'A structured fire ritual with samagri guidance and live support.',
    'Sacred fire at home - structured steps you can follow alongside pandit ji.',
    75,
    210000,
    'INR',
    'active',
    true,
    4,
    array['live_video', 'home_visit'],
    array['Samagri checklist', 'Live guided havan', 'Family participation guidance']
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'New car blessing',
    'newCarBlessing',
    'Vehicle blessing',
    'Start new journeys with a short, auspicious vehicle blessing.',
    'A mindful beginning for journeys ahead - small rituals with big heart.',
    30,
    110000,
    'INR',
    'active',
    true,
    5,
    array['live_video', 'home_visit'],
    array['Short guided blessing', 'Preparation checklist', 'Travel safety sankalp']
  ),
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'Raksha Kavach',
    'examBlessings',
    'Protection shield',
    'Protect your focus before an exam, interview, first day, or big meeting.',
    'Support before big moments - steadiness for students and parents alike.',
    30,
    19900,
    'INR',
    'active',
    true,
    6,
    array['live_video'],
    array['Live blessing', 'Calm preparation note', 'Family sankalp guidance']
  )
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
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

insert into public.mweb_home_banners (
  id, ritual_id, badge, title, subtitle, visual_tone, display_order, status
) values
  (
    '3898eba7-f281-444b-812a-06ed19966382',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'RAKSHA KAVACH',
    'Big exam or interview coming up?',
    'A verified pandit performs Raksha Kavach in your name, so you walk in calm and shielded.',
    'clay',
    1,
    'active'
  ),
  (
    '55ea8539-a9d0-40fd-a035-bc9d3af02a91',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'GHAR AUR VYAPAR',
    'New home, shop, or vehicle?',
    'Bless new beginnings with a verified pandit, clear preparation steps, and status tracking.',
    'gold',
    2,
    'active'
  ),
  (
    '19894153-8c10-489a-bacc-89dfcca857b2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'LIVE SANKALP',
    'Need pandit ji on video?',
    'Join a short guided blessing from home with a preparation checklist and live support.',
    'green',
    3,
    'active'
  ),
  (
    'd32361f0-739d-4975-ad40-e44ed52bb974',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'NAZAR BADHA',
    'Good run suddenly going off?',
    'A pandit performs Nazar Badha to clear the evil eye and help your luck get back on track.',
    'blue',
    4,
    'active'
  )
on conflict (id) do update set
  ritual_id = excluded.ritual_id,
  badge = excluded.badge,
  title = excluded.title,
  subtitle = excluded.subtitle,
  visual_tone = excluded.visual_tone,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

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
) values
  ('c38119f9-75e4-4855-8a1e-55cce96fc324', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'Career & money', 'briefcase', 'New job', 'Start the new chapter protected', 25100, 'INR', false, 1, 'active'),
  ('d91893b2-b6b8-49c6-8659-528413fae5e7', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'Career & money', 'door', 'First day at work', 'Walk in on the right foot', 25100, 'INR', true, 2, 'active'),
  ('aa86ca6f-3d86-4e1e-8739-7f5aa4f3dca5', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'Exams & study', 'pencil', 'Exam day', 'Calm focus when it counts', 25100, 'INR', true, 3, 'active'),
  ('d1902973-cae1-4211-8f9a-ed4ee49a4a75', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'Career & money', 'chat', 'Job interview', 'Steady nerves, clear head', 35100, 'INR', true, 4, 'active'),
  ('45ee8e62-d0d4-4495-b174-fa7376c36b11', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'When it feels off', 'eyeoff', 'Feeling off lately', 'Clear the heavy energy', 19900, 'INR', true, 5, 'active'),
  ('d0696612-5478-48d1-b09f-a839138dae1e', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'When it feels off', 'trenddown', 'A losing streak', 'Break the run of bad luck', 19900, 'INR', true, 6, 'active'),
  ('b8841fdc-e327-4bd1-8d65-213758fd6be0', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Home & family', 'baby', 'New baby at home', 'Shield the little one', 29900, 'INR', false, 7, 'active'),
  ('9d77aa55-0c10-4cc7-b98a-f95d95274100', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Home & family', 'car', 'New vehicle', 'Remove envy before the first drive', 19900, 'INR', false, 8, 'active'),
  ('1e72963d-71a5-4753-938c-2e81ada74c5f', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Home & business', 'home', 'New home / griha pravesh', 'Clear and bless the space before you move in', 35100, 'INR', true, 9, 'active'),
  ('a9f79bcc-3260-47ca-a77a-845e41298029', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Home & business', 'car', 'New vehicle', 'Auspicious first drive', 45100, 'INR', false, 10, 'active'),
  ('d9901d23-006c-4d0c-bca5-2cf3822463e8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Remote rituals', 'video', 'Live video blessing', 'Join pandit ji from home', 25100, 'INR', true, 11, 'active'),
  ('096f3e5e-3f83-47e6-b507-2a5194943fed', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Remote rituals', 'flame', 'Guided home havan', 'Sacred fire ritual with preparation support', 55100, 'INR', false, 12, 'active')
on conflict (id) do update set
  ritual_id = excluded.ritual_id,
  group_label = excluded.group_label,
  icon_name = excluded.icon_name,
  title = excluded.title,
  subtitle = excluded.subtitle,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  is_popular = excluded.is_popular,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

insert into public.faqs (id, question, answer, category, display_order, status) values
  (
    '2ba22257-b5a2-4dec-ac44-756f167565bb',
    'So, how does this actually work?',
    'A verified pandit performs your chosen ritual in your name at a good time. You get booking status and video/certificate delivery when the ritual is complete.',
    'mweb',
    10,
    'active'
  ),
  (
    'db06d0e4-edf8-4ed6-ba56-2d3d0e2ca910',
    'What do I have to do?',
    'Choose a moment, pick a time, verify your phone with OTP, and complete payment. We handle pandit assignment and ritual tracking.',
    'mweb',
    11,
    'active'
  ),
  (
    'c745f3d2-c83e-4f88-87d3-03ccf3eed713',
    'What is the OTP for dev?',
    'For this development build, the OTP is 1234. Later this same flow will use an SMS provider.',
    'mweb',
    12,
    'active'
  )
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

with ritual_ids (ritual_id) as (
  values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid),
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid),
    ('ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid)
), slot_templates (day_offset, slot_time, label, is_auspicious) as (
  values
    (1, '08:30'::time, 'Morning', false),
    (2, '11:54'::time, 'Abhijit Muhurat', true),
    (4, '16:30'::time, 'Evening', false),
    (7, '10:30'::time, 'Auspicious', true)
)
insert into public.mweb_time_slots (
  ritual_id,
  slot_date,
  slot_time,
  label,
  is_auspicious,
  capacity,
  status
)
select
  ritual_ids.ritual_id,
  current_date + slot_templates.day_offset,
  slot_templates.slot_time,
  slot_templates.label,
  slot_templates.is_auspicious,
  50,
  'open'
from ritual_ids
cross join slot_templates
on conflict (ritual_id, slot_date, slot_time) do nothing;
