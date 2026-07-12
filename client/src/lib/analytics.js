const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

let initialized = false;

function canUseBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export function initAnalytics() {
  if (!canUseBrowser() || initialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (GA_MEASUREMENT_ID && !document.getElementById('sankalp-ga4')) {
    const script = document.createElement('script');
    script.id = 'sankalp-ga4';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
    });
  }

  initialized = true;
}

export function trackPageView(path, title) {
  if (!canUseBrowser()) return;
  initAnalytics();

  const payload = {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  };

  window.dataLayer?.push({ event: 'page_view', ...payload });
  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('event', 'page_view', payload);
  }
}

export function trackEvent(name, params = {}) {
  if (!canUseBrowser() || !name) return;
  initAnalytics();

  const payload = cleanParams(params);
  window.dataLayer?.push({ event: name, ...payload });
  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('event', name, payload);
  }
}

export function bookingEventParams(booking = {}) {
  return cleanParams({
    ritual_id: booking.ritualId,
    ritual_name: booking.ritualName,
    moment_id: booking.momentId,
    moment_name: booking.momentName,
    value: Number(booking.price) || undefined,
    currency: 'INR',
  });
}
