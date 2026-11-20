// The only custom events the site sends, and the only properties each may
// carry. Anything else is dropped, so search text, prompts and URLs can't
// reach analytics by accident.
const fields = {
  collection_viewed:['entry','referrer_host','utm_source','utm_medium','utm_campaign'],
  collection_filtered:['query_length','result_count','category','style','sort'],
  reference_opened:['reference_id','surface'],
  reference_played:['reference_id','surface'],
  reference_engaged:['reference_id','surface'],
  reference_prompt_copied:['reference_id'],
  reference_feedback:['reference_id','rating'],
  reference_failed:['reference_id','surface','reason','error_code'],
  setup_prompt_copied:['placement','client'],
  quick_connect_clicked:['client','destination']
};

export const EVENTS = Object.keys(fields);

export function eventProperties(name, input = {}) {
  if (!Object.hasOwn(fields,name)) throw new Error('Unknown analytics event');
  return Object.fromEntries(fields[name].flatMap(key => {
    const value = input[key];
    if (typeof value === 'boolean') return [[key,value]];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return [[key,Math.round(value)]];
    if (typeof value !== 'string' || !value || value.length > 100 || /[@?#]|:\/\//.test(value)) return [];
    return [[key,value]];
  }));
}

// The visitor's analytics switch (/analytics-preferences). Kept here, with no side
// effects, so that page can read and write it without starting analytics itself.
// Written by /analytics-preferences only: 'off' turns website analytics off in this browser.
export const PREFERENCE_KEY = 'kuchi-analytics';

// 'off' or 'on'. Storage that is missing or throws (private mode, blocked site data)
// cannot hold an 'off', so it reads as the default, 'on'.
export function readPreference(storage) {
  try { return storage?.getItem(PREFERENCE_KEY) === 'off' ? 'off' : 'on'; } catch { return 'on'; }
}

// Analytics runs only when the browser sends neither signal and the visitor has not switched it off.
export function analyticsAllowed(privacy, preference = 'on') {
  return !privacy?.globalPrivacyControl && privacy?.doNotTrack !== '1' && preference !== 'off';
}
