// @ts-check

/**
 * @typedef {'Count-Up'|'Count-Down'} TimerCounter Either timer counts up or down.
 */

/**
 * @typedef TimerData
 * @property {string} label Timer descriptor.
 * @property {TimerCounter} type Timer counter type.
 * @property {number} time Timer duration, if applicable.
 */


/**
 * Convert seconds to "HH:MM:SS".
 * @param {number} seconds Seconds to convert.
 * @returns {string}
 */
export function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 3600 % 60);

  const hh = h ? String(h).padStart(2, '0') : '00';
  const mm = m ? String(m).padStart(2, '0') : '00';
  const ss = s ? String(s).padStart(2, '0') : '00';

  return `${hh}:${mm}:${ss}`;
}

/**
 * Convert seconds to "0h 0m 0s".
 * @param {number} seconds Seconds to convert.
 * @returns {string}
 */
export function secondsToHMSshort(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 3600 % 60);

  const hh = h ? `${String(h).padStart(1, '0')}h ` : '';
  const mm = m ? `${String(m).padStart(1, '0')}m ` : '';
  const ss = s ? `${String(s).padStart(1, '0')}s`  : '';

  return `${hh}${mm}${ss}` || '0s';
}
