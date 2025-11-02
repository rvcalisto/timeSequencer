// @ts-check

/**
 * @import { TimerData } from "./timer.js"
 */

/**
 * @typedef SequenceData
 * @property {TimerData[]} timers
 * @property {number} executions
 */


const storageKey = 'sequenceStorage';


/**
 * Get stored sequence list object from localStorage.
 * @returns {Object<string, SequenceData>} Sequence object.
 */
function getStorageObject() {
  const json = localStorage.getItem(storageKey);
  return json ? JSON.parse(json) : {};
}

/**
 * Store sequences object in localStorage. Update list.
 * @param {Object<string, SequenceData>} storageObject Object with sequences.
 */
function setStorageObject(storageObject) {
  localStorage.setItem( storageKey, JSON.stringify(storageObject) );
}

/**
 * Add or update sequence to storage.
 * @param {string} name Sequence name.
 * @param {SequenceData} sequence Sequence object.
 */
export function storeSequence(name, sequence) {
  const storage = getStorageObject();

  storage[name] = sequence;
  setStorageObject(storage);
}

/**
 * Remove sequence from storage, if it exists.
 * @param {string} name Sequence name to remove.
 * @return {boolean} Either it existed before removal.
 */
export function removeSequence(name) {
  const storage = getStorageObject();
  
  const entryExists = storage[name] != null;
  delete storage[name];

  if (entryExists)
    setStorageObject(storage);

  return entryExists;
}

/**
 * Return all stored sequences.
 * @returns {Map<string, SequenceData>}
 */
export function getSequences() {
  const storage = getStorageObject();
  return new Map( Object.entries(storage) );
}
