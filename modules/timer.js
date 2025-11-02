// @ts-check
import { secondsToHMS, secondsToHMSshort } from "./timeUtils.js";


/**
 * @import { TimerCounter } from "./timeUtils.js"
 */


/**
 * Tag element to visualize and configure timer sequence prior to executing it.
 */
export class Timer extends HTMLElement {

  static #nextIdx = 0;

  /**
   * @type {ShadowRoot}
   */
  #shadowRoot;

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
   * Timer total value.
   */
  time = 5;

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
    const template = /** @type {HTMLTemplateElement} */ (document.getElementById('timerTemplate'));
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.appendChild( template.content.cloneNode(true) );

    this.#updateElement();
    this.#updateEditor();
    this.#initEvents();
  }

  disconnectedCallback() {
    dispatchEvent( new CustomEvent('timerUpdated') );
  }

  /**
   * Initialize input event listeners.
   */
  #initEvents() {
    this.onclick = () => {
      if (this.onSelect != null)
        this.onSelect();
    };

    const addBtn = /** @type {HTMLButtonElement} */ (this.#shadowRoot.querySelector('.addNew'));
    addBtn.onclick = (e) => {
      e.stopPropagation()
      if (this.onAddNew != null)
        this.onAddNew();
    };

    const delBtn = /** @type {HTMLButtonElement} */ (this.#shadowRoot.querySelector('.remove'));
    delBtn.onclick = (e) => {
      e.stopPropagation()
      if (this.onRemove != null)
        this.onRemove();
    };

    const inputType = /** @type {HTMLSelectElement} */ (this.#shadowRoot.querySelector('#editorType'));
    inputType.onchange = () => {
      this.type = /** @type {TimerCounter} */ (inputType.value);

      // set time to zero if counting up, 5s otherwise
      if (this.type == 'Count-Up')
        this.time = 0;
      else if (this.time == 0)
        this.time = 5;

      this.#updateEditor();
      this.#updateElement();
    };

    const labelInput = /** @type {HTMLInputElement} */ (this.#shadowRoot.querySelector('#editorLabel'));
    labelInput.oninput = () => {
      this.label = labelInput.value;
      this.#updateElement();
    };

    const updateTimeByValue = (/** @type {number} */ value) => {
      const newTime = this.time + value;

      // clamp time based on type
      if (this.type == 'Count-Up')
        this.time = Math.max(0, 0);
      else
        this.time = Math.max(1, newTime);

      this.#updateElement();
      this.#updateEditor();
    };

    const editorHour = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorHour'));
    editorHour.addEventListener('wheel', (e) => {
      e.preventDefault();
      updateTimeByValue(e.deltaY < 0 ? 3600 : -3600);
    });

    const editorMin = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorMin'));
    editorMin.addEventListener('wheel', (e) => {
      e.preventDefault();
      updateTimeByValue(e.deltaY < 0 ? 60 : -60);
    });

    const editorSec = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorSec'));
    editorSec.addEventListener('wheel', (e) => {
      e.preventDefault();
      updateTimeByValue(e.deltaY < 0 ? 1 : -1);
    });
  }

  /**
   * Update editor inputs with current timer data.
   */
  #updateEditor() {
    const typeInput = /** @type {HTMLSelectElement} */ (this.#shadowRoot.querySelector('#editorType'));
    const labelInput = /** @type {HTMLInputElement} */ (this.#shadowRoot.querySelector('#editorLabel'));

    typeInput.value = this.type;
    labelInput.value = this.label;

    const [ hh, mm, ss ] = secondsToHMS(this.time).split(':');
    
    const editorHour = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorHour'));
    editorHour.textContent = hh;
    
    const editorMin = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorMin'));
    editorMin.textContent = mm;
    
    const editorSec = /** @type {HTMLLabelElement} */ (this.#shadowRoot.querySelector('#editorSec'));
    editorSec.textContent = ss;

    dispatchEvent( new CustomEvent('timerUpdated') );
  }

  /**
   * Update label elements to reflect property values.
   */
  #updateElement() {
    const timerInfo = /** @type {HTMLDivElement} */ (this.#shadowRoot.querySelector('#timerInfo'));
    const [ label, type, time ] = /** @type {HTMLLabelElement[]} */ ([...timerInfo.children]);

    label.textContent = this.label;
    type.textContent = this.type;
    time.textContent = secondsToHMSshort(this.time);

    const icon = this.type == 'Count-Up'
      ? 'clockUp'
      : 'clockDown';

    timerInfo.style.backgroundImage = `url(icons/${icon}.webp)`;
  }
}
