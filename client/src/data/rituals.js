export const RITUALS = [
  {
    id: 'rk',
    name: 'Raksha Kavach',
    tag: 'RAKSHA KAVACH',
    tagline: 'Big exam or interview coming up?',
    desc: 'A verified pandit performs Raksha Kavach in your name, so you walk in calm and shielded.',
    color: '#F0C189',
    bg: 'linear-gradient(135deg, #F5EDE0 0%, #E8D5B5 100%)',
    rating: '4.9', count: '6,210', from: 149,
    why: 'Before a moment that matters, Raksha Kavach surrounds you with protective energy — shielding you from negativity, the evil eye and self-doubt, so you show up at your best.',
    how: 'A verified pandit performs a sankalp in your name and gotra, recites protective mantras and offers ahuti into a sacred fire at an auspicious muhurat.',
    groups: [
      {
        name: 'CAREER & MONEY',
        moments: [
          { id: 'rk-nj',  name: 'New job',          why: 'Start the new chapter protected',  price: 149, pop: false, ic: 'briefcase' },
          { id: 'rk-fd',  name: 'First day at work', why: 'Walk in on the right foot',         price: 149, pop: true,  ic: 'door'      },
          { id: 'rk-bm',  name: 'Big meeting',       why: 'Protection before the room',        price: 149, pop: false, ic: 'meeting'   },
          { id: 'rk-ji',  name: 'Job interview',     why: 'Steady nerves, clear head',         price: 149, pop: true,  ic: 'chat'      },
        ],
      },
      {
        name: 'EXAMS & STUDY',
        moments: [
          { id: 'rk-ed',  name: 'Exam day',    why: 'Calm focus when it counts',    price: 149, pop: true,  ic: 'pencil' },
          { id: 'rk-rd',  name: 'Results day', why: 'Hold your nerve for the news', price: 149, pop: false, ic: 'trophy' },
        ],
      },
      {
        name: 'TRAVEL & BIG DAYS',
        moments: [
          { id: 'rk-fl',  name: 'Flight / travel',   why: 'Safe passage, there and back',     price: 149, pop: true,  ic: 'plane'  },
          { id: 'rk-sh',  name: 'Surgery / health',  why: 'A shield through the procedure',   price: 149, pop: false, ic: 'health' },
          { id: 'rk-nh',  name: 'New home',          why: 'Bless and protect the move',       price: 149, pop: false, ic: 'home'   },
        ],
      },
    ],
  },
  {
    id: 'da',
    name: 'Dhan Aagman',
    tag: 'DHAN AAGMAN',
    tagline: 'New home, shop, or vehicle?',
    desc: 'Bless new beginnings with a verified pandit, clear preparation steps, and status tracking.',
    color: '#F2D58A',
    bg: 'linear-gradient(135deg, #FAF3DC 0%, #EDD98A 100%)',
    rating: '4.8', count: '4,120', from: 149,
    why: 'Before a money moment, Dhan Aagman invites the blessings of Lakshmi and Kuber — clearing blocks around wealth and opening the path for prosperity to flow in.',
    how: 'A pandit performs Lakshmi-Kuber puja in your name with kalash sthapana, mantra japa and aarti at a prosperous muhurat.',
    groups: [
      {
        name: 'CAREER & DEALS',
        moments: [
          { id: 'da-bd',  name: 'Big deal or pitch',     why: 'Tip the odds your way',         price: 149, pop: true,  ic: 'invest' },
          { id: 'da-ji',  name: 'Job interview',         why: 'Walk in with the blessings',    price: 149, pop: true,  ic: 'chat'   },
          { id: 'da-sp',  name: 'Salary or promotion',  why: 'Ask from a place of fortune',   price: 149, pop: false, ic: 'tag'    },
          { id: 'da-ns',  name: 'New shop / business',  why: 'Open the doors with blessings', price: 149, pop: false, ic: 'shop'   },
        ],
      },
      {
        name: 'BIG BUYS & VENTURES',
        moments: [
          { id: 'da-sv',  name: 'New venture / startup', why: 'Bless the launch',              price: 149, pop: true,  ic: 'rocket'   },
          { id: 'da-pd',  name: 'Property deal',         why: 'Seal it with prosperity',       price: 149, pop: false, ic: 'building' },
          { id: 'da-nv',  name: 'New vehicle',           why: 'Auspicious first drive',        price: 149, pop: false, ic: 'car'      },
          { id: 'da-it',  name: 'Investment / trade',    why: 'Enter the market with clarity', price: 149, pop: false, ic: 'cash'     },
        ],
      },
    ],
  },
  {
    id: 'ps',
    name: 'Prem Setu',
    tag: 'PREM SETU',
    tagline: "Something you've been meaning to say?",
    desc: 'A pandit performs Prem Setu to strengthen a bond or give you the nerve to say it.',
    color: '#F2B79A',
    bg: 'linear-gradient(135deg, #FAE8DC 0%, #E8A87A 100%)',
    rating: '4.9', count: '3,540', from: 149,
    why: 'Prem Setu strengthens the bond between two hearts — softening distance, healing misunderstandings, and bringing the courage to express what you feel.',
    how: 'A pandit invokes the blessings of love and harmony in your name, with mantra and offerings dedicated to your intention at an auspicious time.',
    groups: [
      {
        name: 'EXPRESSING LOVE',
        moments: [
          { id: 'ps-cf',  name: 'Confess your feelings', why: 'Find the nerve to say it',      price: 149, pop: true,  ic: 'heart' },
          { id: 'ps-pr',  name: 'Before you propose',    why: 'Bless the big question',        price: 149, pop: true,  ic: 'ring'  },
          { id: 'ps-an',  name: 'Anniversary',           why: 'Renew the connection',          price: 149, pop: false, ic: 'star'  },
          { id: 'ps-ld',  name: 'Long distance bond',    why: 'Keep the connection strong',    price: 149, pop: false, ic: 'users' },
        ],
      },
      {
        name: 'MENDING & HEALING',
        moments: [
          { id: 'ps-pf',  name: 'Patch a fight',    why: 'Mend a strained bond',            price: 149, pop: true,  ic: 'bandage'   },
          { id: 'ps-wb',  name: 'Win them back',    why: 'Reopen the door gently',          price: 149, pop: false, ic: 'door'      },
          { id: 'ps-fh',  name: 'Family harmony',   why: 'Bring peace back to the home',    price: 149, pop: false, ic: 'homeheart' },
          { id: 'ps-ms',  name: 'Marriage / shaadi', why: 'Bless the union before the day', price: 149, pop: false, ic: 'diamond'   },
        ],
      },
    ],
  },
  {
    id: 'nb',
    name: 'Nazar Badha',
    tag: 'NAZAR BADHA',
    tagline: 'Good run suddenly going off?',
    desc: 'A pandit performs Nazar Badha to clear the evil eye and help your luck get back on track.',
    color: '#CBD5F5',
    bg: 'linear-gradient(135deg, #E8EDFF 0%, #A0B0E8 100%)',
    rating: '4.9', count: '6,820', from: 149,
    why: 'When luck turns or things feel heavy, Nazar Badha clears the evil eye and negative energy that can follow good fortune — resetting your path.',
    how: 'A pandit performs the nazar utaarna vidhi in your name with the traditional remedies and mantras, dispelling drishti dosha at the right muhurat.',
    groups: [
      {
        name: 'CLEARING THE NAZAR',
        moments: [
          { id: 'nb-ls',  name: 'A losing streak',       why: 'Break the run of bad luck',          price: 149, pop: true,  ic: 'trenddown' },
          { id: 'nb-nv',  name: 'New vehicle',           why: 'Remove envy before the first drive', price: 149, pop: false, ic: 'car'       },
          { id: 'nb-bh',  name: 'Business / home nazar', why: 'Protect what you\'ve built',         price: 149, pop: true,  ic: 'shop'      },
          { id: 'nb-hf',  name: 'Health / family',       why: 'Clear heavy energy from loved ones', price: 149, pop: false, ic: 'health'    },
        ],
      },
    ],
  },
];

export function getRitual(id) {
  return RITUALS.find(r => r.id === id) || null;
}

export function getMoment(ritualId, momentId) {
  const ritual = getRitual(ritualId);
  if (!ritual) return null;
  for (const group of ritual.groups) {
    const m = group.moments.find(m => m.id === momentId);
    if (m) return { ...m, ritualName: ritual.name, ritualId: ritual.id };
  }
  return null;
}

export function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
