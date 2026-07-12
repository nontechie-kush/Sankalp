import { supabase } from './supabase';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export async function loadBackendPriceMap() {
  const [useCasesResult, ritualsResult] = await Promise.all([
    supabase
      .from('mweb_ritual_use_cases')
      .select('ritual_id,title,price_minor,status')
      .eq('status', 'active'),
    supabase
      .from('rituals')
      .select('id,title,slug,status')
      .eq('status', 'active'),
  ]);

  if (useCasesResult.error) throw useCasesResult.error;
  if (ritualsResult.error) throw ritualsResult.error;

  const ritualsById = new Map((ritualsResult.data || []).map((ritual) => [ritual.id, ritual]));
  const prices = new Map();

  for (const useCase of useCasesResult.data || []) {
    const ritual = ritualsById.get(useCase.ritual_id);
    if (!ritual?.title || !useCase.title || !useCase.price_minor) continue;
    prices.set(
      `${normalize(ritual.title)}::${normalize(useCase.title)}`,
      Math.round(Number(useCase.price_minor) / 100),
    );
  }

  return prices;
}

export function applyBackendPrices(rituals, priceMap) {
  return rituals.map((ritual) => {
    const groups = ritual.groups.map((group) => {
      const moments = group.moments.map((moment) => {
        const backendPrice = priceMap.get(`${normalize(ritual.name)}::${normalize(moment.name)}`);
        return backendPrice ? { ...moment, price: backendPrice } : moment;
      });
      return { ...group, moments };
    });

    const visiblePrices = groups.flatMap((group) => group.moments.map((moment) => moment.price).filter(Boolean));
    return {
      ...ritual,
      groups,
      from: visiblePrices.length ? Math.min(...visiblePrices) : ritual.from,
    };
  });
}
