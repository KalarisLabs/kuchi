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
