// Product analytics for the gallery, sent to PostHog through this site's own
// /relay path.
//
// Privacy rules this file keeps:
//   - Nothing is stored in the browser: no cookies, no local storage. Each
//     page load is its own anonymous visit.
//   - Do Not Track and Global Privacy Control switch analytics off entirely.
//   - No session recording, no surveys, and no IP address on any event.
//   - Custom events carry only the properties listed in analytics-events.mjs.
// Analytics must never break the page: every failure here ends in `false`.
import {eventProperties} from './analytics-events.mjs';

const SDK_DEFAULTS = '2026-08-30';

export function initOptions(config, isTest) {
  return {
    api_host:config.api_host,
    ui_host:config.ui_host,
    defaults:SDK_DEFAULTS,
    persistence:'memory',
    person_profiles:'never',
    disable_session_recording:true,
    disable_surveys:true,
    enable_heatmaps:true,
    capture_exceptions:true,
    capture_performance:{web_vitals:true,network_timing:false},
    // Clicks are recorded by element, never by what a visitor typed.
    autocapture:{element_attribute_ignorelist:['value','placeholder']},
    before_send:event => {
      if (!event) return null;
      // Stops PostHog from storing the visitor's IP address or deriving a location from it.
      event.properties = {...event.properties,$ip:null,$geoip_disable:true,app:'kuchi',source:'web',is_test:isTest,...(config.country ? {country:config.country} : {})};
      return event;
    }
  };
}

// Loads PostHog's script from this site and starts it. Resolves to the client, or null.
export function createAnalytics({config,loadScript,getClient,privacy,isTest = false}) {
  const allowed = !privacy?.globalPrivacyControl && privacy?.doNotTrack !== '1';
  const ready = !allowed ? Promise.resolve(null) : Promise.resolve(config).then(async settings => {
    if (!settings?.token || !settings.api_host) return null;
    await loadScript(`${settings.api_host}/static/array.js`);
    const client = getClient();
    if (!client?.init) return null;
    client.init(settings.token,initOptions(settings,isTest));
    return client;
  }).catch(() => null);
  const track = async (name,properties = {}) => {
    try {
      const client = await ready;
      if (!client) return false;
      client.capture(name,eventProperties(name,properties));
      return true;
    } catch { return false; }
  };
  return {track,ready};
}

const browser = typeof window !== 'undefined';
const privacy = browser ? {globalPrivacyControl:navigator.globalPrivacyControl,doNotTrack:navigator.doNotTrack} : {};
const permitted = browser && !privacy.globalPrivacyControl && privacy.doNotTrack !== '1';
const analytics = createAnalytics({
  privacy,
  config:permitted ? fetch('/relay/config',{cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null) : null,
  isTest:browser && (new URLSearchParams(location.search).get('analytics_test') === '1' || ['localhost','127.0.0.1'].includes(location.hostname)),
  loadScript:src => new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.src = src; script.async = true; script.crossOrigin = 'anonymous';
    script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  }),
  getClient:() => window.posthog
});
export const track = analytics.track;

if (permitted && /^\/?$/.test(location.pathname)) {
  let referrer = '';
  try { referrer = new URL(document.referrer).hostname; } catch { /* Direct visit. */ }
  const params = new URLSearchParams(location.search);
  track('collection_viewed',{entry:location.hash.startsWith('#video-') ? 'reference_link' : 'collection',referrer_host:referrer,...Object.fromEntries(['utm_source','utm_medium','utm_campaign'].map(key=>[key,params.get(key)]))});
}
