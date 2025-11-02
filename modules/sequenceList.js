// @ts-check
import { Sequence } from "./sequence.js";
import { getSequences, removeSequence, storeSequence } from "./sequenceStorage.js";


const listElement = /** @type {HTMLDivElement} */ (document.getElementById('sequenceList'));
const saveElement = /** @type {HTMLButtonElement} */ (document.getElementById('sequenceSave'));


/**
 * Populate list with sequences from localStorage.
 */
function populateSequences() {
  const sequenceTitles = getSequences().keys();
  listElement.textContent = '';

  for (const entry of sequenceTitles) {
    const btn = document.createElement('button');
    btn.textContent = entry;
    btn.style.background = '#333333';
    btn.style.borderColor = '#111111';
    btn.title = 'Load sequence. Right-click to remove';

    btn.onclick = () => loadSequence(entry);

    btn.oncontextmenu = () => {
      removeSequence(entry);
      populateSequences();
      return false;
    };

    listElement.appendChild(btn);
  }
}

/**
 * Store all timer items as a named sequence in localStorage.
 */
function storeCurrentSequence() {
  if (Sequence.title.trim() !== '') {
    storeSequence( Sequence.title, Sequence.exportSequence() );
    populateSequences();

    console.log(`saved timer items as ${Sequence.title}`);
  }
}

/**
 * Restore all timer items from a named sequence in localStorage.
 * @param {string} loadName Stored sequence name.
 */
function loadSequence(loadName) {
  const sequence = getSequences().get(loadName);

  if (sequence == null)
    console.log(`no sequence named ${loadName} in storage.`);
  else {
    Sequence.importSequence(loadName, sequence);
    console.log(`loaded timer items from ${loadName}`);
  }
}

function initialize() {
  populateSequences();
  saveElement.onclick = () => storeCurrentSequence();
}

initialize();
