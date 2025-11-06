// @ts-check
import { secondsToHMS, secondsToHMSshort } from "./timeUtils.js";
import { NumericInput } from "./numericInput.js";


/**
 * @import { TimerCounter } from "./timeUtils.js"
 */


/**
 * Sequence Timer custom element.
 */
export class Timer extends HTMLElement {

  static #nextIdx = 0;

  /** @type {ShadowRoot}   */ #shadowRoot;
  /** @type {NumericInput} */ #editorHour;
  /** @type {NumericInput} */ #editorMin;
  /** @type {NumericInput} */ #editorSec;

  /**
   * Timer label.
   */
  label = `Timer #${++Timer.#nextIdx}`;

  /**
   * Timer type.
   * @type {TimerCounter}
   */
  type = 'Count-Down';

  /**
   * On element selection.
   * @type {Function?}
   */
  onSelect;

  /**
   * On 'add new' click.
   * @type {Function?}
   */
  onAddNew;

  /**
   * On 'remove' click.
   * @type {Function?}
   */
  onRemove;

  static {
    customElements.define('timer-item', Timer);
  }

  connectedCallback() {
    const template = /** @type {HTMLTemplateElement} */ (document.querySelector('#timerTemplate'));
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.appendChild( template.content.cloneNode(true) );

    this.#editorHour = /** @type {NumericInput} */ (this.#shadowRoot.querySelector('#editorHour'));
    this.#editorMin = /** @type {NumericInput} */ (this.#shadowRoot.querySelector('#editorMin'));
    this.#editorSec = /** @type {NumericInput} */ (this.#shadowRoot.querySelector('#editorSec'));

    this.#updateEditor();
    this.#initEvents();
  }

  disconnectedCallback() {
    dispatchEvent( new CustomEvent('timerUpdated') );
  }

  /**
   * Total timer value.
   * @param {number} seconds
   */
  set time(seconds) {
    const [ hh, mm, ss ] = secondsToHMS(seconds).split(':');

    this.#editorHour.value = Number(hh);
    this.#editorMin.value = Number(mm);
    this.#editorSec.value = Number(ss);

    this.#updateInfo();
    dispatchEvent( new CustomEvent('timerUpdated') );
  }

  get time() {
    return this.#editorHour.value * 3600
         + this.#editorMin.value * 60
         + this.#editorSec.value;
  }

  /**
   * Update editor inputs with current timer data.
   */
  #updateEditor() {
    const typeInput = /** @type {HTMLSelectElement} */ (this.#shadowRoot.querySelector('#editorType'));
    const labelInput = /** @type {HTMLInputElement} */ (this.#shadowRoot.querySelector('#editorLabel'));

    typeInput.value = this.type;
    labelInput.value = this.label;

    // set time to zero if counting up, 5s otherwise
    this.#editorHour.max = this.type == 'Count-Up' ? 0 : 99;
    this.#editorMin.max  = this.type == 'Count-Up' ? 0 : 59;
    this.#editorSec.max  = this.type == 'Count-Up' ? 0 : 59;
    this.time            = this.type == 'Count-Up' ? 0 : 5;

    this.#updateInfo();
    dispatchEvent( new CustomEvent('timerUpdated') );
  }

  /**
   * Update label elements to reflect property values.
   */
  #updateInfo() {
    const timerInfo = /** @type {HTMLDivElement} */ (this.#shadowRoot.querySelector('#timerInfo'));
    const [ label, type, time ] = /** @type {HTMLParagraphElement[]} */ ([...timerInfo.children]);

    label.textContent = this.label;
    type.textContent = this.type;
    time.textContent = secondsToHMSshort(this.time);

    const icon = this.type === 'Count-Up'
      ? 'clockUp'
      : 'clockDown';

    timerInfo.style.backgroundImage = `url(icons/${icon}.webp)`;
  }

  /**
   * Initialize input event listeners.
   */
  #initEvents() {
    // select on click
    this.onclick = () => {
      if (this.onSelect != null)
        this.onSelect();
    };

    // add new instance
    const addBtn = /** @type {HTMLButtonElement} */ (this.#shadowRoot.querySelector('.addNew'));
    addBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.onAddNew != null)
        this.onAddNew();
    };

    // remove itself
    const delBtn = /** @type {HTMLButtonElement} */ (this.#shadowRoot.querySelector('.remove'));
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.onRemove != null)
        this.onRemove();
    };

    // change timer type
    const inputType = /** @type {HTMLSelectElement} */ (this.#shadowRoot.querySelector('#editorType'));
    inputType.onchange = () => {
      this.type = /** @type {TimerCounter} */ (inputType.value);
      this.#updateEditor();
      this.#updateInfo();
    };

    // change timer label
    const labelInput = /** @type {HTMLInputElement} */ (this.#shadowRoot.querySelector('#editorLabel'));
    labelInput.oninput = () => {
      this.label = labelInput.value;
      this.#updateInfo();
    };

    const onTimeElementChange = () => {
      this.#updateInfo();
      dispatchEvent( new CustomEvent('timerUpdated') );
    }

    // signal time update
    this.#editorHour.onValueChange
      = this.#editorMin.onValueChange
      = this.#editorSec.onValueChange = onTimeElementChange;
  }
}
