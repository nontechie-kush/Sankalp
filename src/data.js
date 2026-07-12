// ─────────────────────────────────────────────────
//  Sankalp — Ritual & Booking Data
//  In production: replace with database calls
// ─────────────────────────────────────────────────

const RITUALS = [
  {
    key: 'rk',
    name: 'Raksha Kavach',
    tag: 'Protection shield',
    rating: '4.9',
    count: '6,210',
    from: '₹199',
    ic: 'shield',
    why: 'Before a moment that matters, Raksha Kavach surrounds you with protective energy — shielding you from negativity, the evil eye and self-doubt, so you show up at your best.',
    how: 'A verified pandit performs a sankalp in your name and gotra, recites protective mantras and offers ahuti into a sacred fire at an auspicious muhurat.',
    effect: 'People describe a noticeable calm and steadiness — fewer nerves, sharper focus, the quiet confidence of feeling protected.',
    groups: [
      {
        name: 'Career & money',
        items: [
          { ic: 'briefcase', n: 'New job', w: 'Start the new chapter protected', p: '₹251' },
          { ic: 'door', n: 'First day at work', w: 'Walk in on the right foot', p: '₹251', pop: true },
          { ic: 'meeting', n: 'Big meeting', w: 'Protection before the room', p: '₹351' },
          { ic: 'chat', n: 'Job interview', w: 'Steady nerves, clear head', p: '₹351', pop: true },
        ],
      },
      {
        name: 'Exams & study',
        items: [
          { ic: 'pencil', n: 'Exam day', w: 'Calm focus when it counts', p: '₹251', pop: true },
          { ic: 'trophy', n: 'Results day', w: 'Hold your nerve for the news', p: '₹251' },
        ],
      },
      {
        name: 'Travel & big days',
        items: [
          { ic: 'plane', n: 'Flight / travel', w: 'Safe passage, there and back', p: '₹299', pop: true },
          { ic: 'health', n: 'Surgery / health', w: 'A shield through the procedure', p: '₹551' },
          { ic: 'home', n: 'New home', w: 'Bless and protect the move', p: '₹751' },
        ],
      },
    ],
  },
  {
    key: 'da',
    name: 'Dhan Aagman',
    tag: 'Wealth & fortune',
    rating: '4.8',
    count: '4,120',
    from: '₹351',
    ic: 'coin',
    why: 'Before a money moment, Dhan Aagman invites the blessings of Lakshmi and Kuber — clearing blocks around wealth and opening the path for prosperity to flow in.',
    how: 'A pandit performs Lakshmi-Kuber puja in your name with kalash sthapana, mantra japa and aarti at a prosperous muhurat.',
    effect: 'A renewed sense of abundance and confidence going into the deal or purchase — and a blessed coin sent to you to keep in your wallet.',
    groups: [
      {
        name: 'Career & deals',
        items: [
          { ic: 'invest', n: 'Big deal or pitch', w: 'Tip the odds your way', p: '₹551', pop: true },
          { ic: 'chat', n: 'Job interview', w: 'Walk in with the blessings', p: '₹351', pop: true },
          { ic: 'tag', n: 'Salary or promotion', w: 'Ask from a place of fortune', p: '₹451' },
          { ic: 'shop', n: 'New shop / business', w: 'Open the doors with blessings', p: '₹751' },
        ],
      },
      {
        name: 'Big buys & ventures',
        items: [
          { ic: 'rocket', n: 'New venture / startup', w: 'Bless the launch', p: '₹751', pop: true },
          { ic: 'building', n: 'Property deal', w: 'Seal it with prosperity', p: '₹751' },
          { ic: 'car', n: 'New vehicle', w: 'Auspicious first drive', p: '₹451' },
          { ic: 'cash', n: 'Investment / trade', w: 'Enter the market with clarity', p: '₹451' },
        ],
      },
    ],
  },
  {
    key: 'ps',
    name: 'Prem Setu',
    tag: 'For the heart',
    rating: '4.9',
    count: '3,540',
    from: '₹251',
    ic: 'heart',
    why: 'Prem Setu strengthens the bond between two hearts — softening distance, healing misunderstandings, and bringing the courage to express what you feel.',
    how: 'A pandit invokes the blessings of love and harmony in your name, with mantra and offerings dedicated to your intention at an auspicious time.',
    effect: 'Many feel lighter and braver afterwards — an openness and warmth that helps the conversation, or the connection, find its way.',
    groups: [
      {
        name: 'Expressing love',
        items: [
          { ic: 'heart', n: 'Confess your feelings', w: 'Find the nerve to say it', p: '₹251', pop: true },
          { ic: 'ring', n: 'Before you propose', w: 'Bless the big question', p: '₹451', pop: true },
          { ic: 'star', n: 'Anniversary', w: 'Renew the connection', p: '₹451' },
          { ic: 'users', n: 'Long distance bond', w: 'Keep the connection strong', p: '₹251' },
        ],
      },
      {
        name: 'Mending & healing',
        items: [
          { ic: 'bandage', n: 'Patch a fight', w: 'Mend a strained bond', p: '₹351', pop: true },
          { ic: 'door', n: 'Win them back', w: 'Reopen the door gently', p: '₹351' },
          { ic: 'homeheart', n: 'Family harmony', w: 'Bring peace back to the home', p: '₹551' },
          { ic: 'diamond', n: 'Marriage / shaadi', w: 'Bless the union before the day', p: '₹751' },
        ],
      },
    ],
  },
  {
    key: 'nb',
    name: 'Nazar Badha',
    tag: 'Clear the evil eye',
    rating: '4.9',
    count: '6,820',
    from: '₹199',
    ic: 'eye',
    why: "When luck turns or things feel heavy, Nazar Badha clears the evil eye and negative energy that can follow good fortune — resetting your path.",
    how: 'A pandit performs the nazar utaarna vidhi in your name with the traditional remedies and mantras, dispelling drishti dosha at the right muhurat.',
    effect: 'A clearing, unburdened feeling — as if a weight has lifted — and a small protective remedy sent to you to keep the nazar away.',
    groups: [
      {
        name: "When it's off",
        items: [
          { ic: 'eyeoff', n: 'Feeling off lately', w: 'Clear the heavy energy', p: '₹199', pop: true },
          { ic: 'trenddown', n: 'A losing streak', w: 'Break the run of bad luck', p: '₹199', pop: true },
          { ic: 'star', n: 'After a big win', w: 'Protect the good run', p: '₹199' },
          { ic: 'mood', n: 'Unexplained anxiety', w: "Lift the weight you can't name", p: '₹199' },
          { ic: 'health', n: 'Health hiccups', w: 'Clear energy blocks around healing', p: '₹299' },
        ],
      },
      {
        name: 'Home & family',
        items: [
          { ic: 'baby', n: 'New baby at home', w: 'Shield the little one', p: '₹299' },
          { ic: 'shop', n: 'New shop or business', w: 'Ward off the bad eye', p: '₹351' },
          { ic: 'home', n: 'New home / ghar pravesh', w: 'Clear the space before you move in', p: '₹351' },
          { ic: 'car', n: 'New vehicle', w: 'Remove envy before the first drive', p: '₹199' },
        ],
      },
    ],
  },
];

const SLOTS = [
  { t: '07:30', label: 'Shubh', auspicious: true, bad: false },
  { t: '09:15', label: '', auspicious: false, bad: false },
  { t: '11:54', label: 'Abhijit · best', auspicious: true, bad: false },
  { t: '13:20', label: '', auspicious: false, bad: false },
  { t: '15:00', label: 'Rahu · avoid', auspicious: false, bad: true },
  { t: '17:30', label: 'Shubh', auspicious: true, bad: false },
];

const MOCK_BOOKINGS = {
  upcoming: [
    {
      id: 'SK24817',
      ritual: 'Raksha Kavach',
      ritualKey: 'rk',
      moment: 'Exam day',
      date: '2026-07-15',
      slot: '11:54',
      muhurat: 'Abhijit Muhurat',
      price: '₹251',
      status: 'upcoming',
      pandit: { name: 'Pandit Sharma', rating: 4.9, location: 'Haridwar', years: 12 },
    },
  ],
  past: [
    {
      id: 'SK19234',
      ritual: 'Nazar Badha',
      ritualKey: 'nb',
      moment: 'Feeling off lately',
      date: '2026-07-01',
      slot: '09:15',
      price: '₹199',
      status: 'completed',
      videoThumb: true,
      videoDuration: '0:31',
    },
    {
      id: 'SK14876',
      ritual: 'Dhan Aagman',
      ritualKey: 'da',
      moment: 'Job interview',
      date: '2026-06-25',
      slot: '07:30',
      price: '₹351',
      status: 'completed',
      videoThumb: true,
      videoDuration: '0:28',
    },
  ],
};

module.exports = { RITUALS, SLOTS, MOCK_BOOKINGS };
