// @ts-check
import { Sequence } from "./sequence.js";
import { getSequences, removeSequence, storeSequence } from "./sequenceStorage.js";


const listElement = /** @type {HTMLDivElement} */ (document.getElementById('sequenceList'));
const saveElement = /** @type {HTMLButtonElement} */ (document.getElementById('saveSequence'));


/**
 * Populate list with sequences from localStorage.
 */
function populateSequences() {
  const sequenceTitles = getSequences().keys();
  listElement.textContent = '';

  for (const entry of sequenceTitles) {
    const element = document.createElement('div');
    element.title = 'Load sequence';

    const label = document.createElement('p');
    label.textContent = entry;

    const removeButton = document.createElement('button');
    removeButton.title = 'Remove sequence from list';
    removeButton.textContent = '❌';

    element.onclick = () => loadSequence(entry);

    removeButton.onclick = () => {
      removeSequence(entry);
      populateSequences();
      return false;
    };

    element.append(label, removeButton);
    listElement.appendChild(element);
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

/**
 * Toggle sequence save button.
 * @param {boolean} [disable=true] Either to disable button.
 */
export function disableSaveButton(disable = true) {
  saveElement.disabled = disable;
}

function initialize() {
  populateSequences();
  saveElement.onclick = () => storeCurrentSequence();
}

initialize();
