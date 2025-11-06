// @ts-check
import { Overlay } from "./overlay.js";
import { disableSaveButton } from "./sequenceList.js";
import { Timer } from "./timer.js"
import { secondsToHMSshort } from "./timeUtils.js";
import { NumericInput } from "./numericInput.js";


/**
 * @import { SequenceData } from "./sequenceStorage.js"
 */


/**
 * Sequence composer.
 */
export const Sequence = new class {

  #sequencer = /** @type {HTMLDivElement} */ (document.getElementById('sequencer'));
  #sequenceInputElement = /** @type {HTMLInputElement} */ (document.getElementById('sequenceTitle'));
  #executionInputElement = /** @type {NumericInput} */ (document.getElementById('executeCount'));
  #estimatedTimeLabel = /** @type {HTMLParagraphElement} */ (document.getElementById('estimatedTime'));

  constructor() {
    this.#executionInputElement.min = 1;
    this.#executionInputElement.max = 99;
    this.#executionInputElement.value = 1;

    this.#initEvents();
  }

  /**
   * Sequence title.
   * @param {string} value
   */
  set title(value) {
    this.#sequenceInputElement.value = value;
    disableSaveButton( value.trim() === '' );
  }

  get title() {
    return this.#sequenceInputElement.value;
  }

  /**
   * Times the sequence should be executed.
   * @param {number} value
   */
  set totalExecutions(value) {
    this.#executionInputElement.value = value;
    this.#updateEstimatedTime();
  }

  get totalExecutions() {
    return this.#executionInputElement.value;
  }

  get #allTimers() {
    return /** @type {Timer[]} */ ([...this.#sequencer.children]);
  }

  #newTimer() {
    const timer = /** @type {Timer} */ (document.createElement('timer-item'));

    timer.onSelect = () => {
      const currentlySelected = this.#sequencer.querySelector('.selected');
      if (currentlySelected)
        currentlySelected.classList.remove('selected');

      timer.classList.add('selected');
      timer.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    };

    timer.onAddNew = () => {
      const child = this.#newTimer();
      timer.after(child);
      child.click();
    };

    timer.onRemove = () => {
      if (this.#allTimers.length < 2)
        return;

      const next = timer.nextSibling
        ? timer.nextSibling
        : timer.previousSibling;

      timer.remove();
      /** @type {Timer} */ (next).click();
    };

    return timer;
  }

  /**
   * Add timer to sequencer.
   * @param {Timer} [before] Either to add timer before element.
   */
  addTimer(before) {
    const timer = this.#newTimer();

    before != null
      ? before.before(timer)
      : this.#sequencer.appendChild(timer);

    timer.click();
  }

  /**
   * Import previous sequence.
   * @param {string} name Sequence name.
   * @param {SequenceData} sequence Sequence data.
   */
  importSequence(name, sequence) {
    this.#sequencer.textContent = '';

    this.title = name;
    this.totalExecutions = sequence.executions;

    for (const { label, type, time } of sequence.timers) {
      const timer = this.#newTimer();
      timer.label = label;
      timer.type = type;

      this.#sequencer.appendChild(timer);
      timer.time = Number(time);
    }

    // select last
    const last = /** @type {Timer|undefined} */ (this.#sequencer.lastChild);
    last?.click();
  }

  /**
   * Export current sequence.
   * @returns {SequenceData}
   */
  exportSequence() {
    return {
      executions: this.totalExecutions,
      timers: this.#allTimers.map((timer) => ({
        label: timer.label,
        type: timer.type,
        time: timer.time
      }))
    };
  }

  /**
   * Update estimated sequence duration as show on screen.
   */
  #updateEstimatedTime() {
    let timeInSecs = 0;
    this.#allTimers.forEach(timer => timeInSecs += timer.time);

    const HMS = secondsToHMSshort(timeInSecs * this.totalExecutions);
    this.#estimatedTimeLabel.textContent = HMS;
  }

  #initEvents() {
    disableSaveButton( this.#sequenceInputElement.value.trim() === '' );
    this.#updateEstimatedTime();

    // update sequence title
    this.#sequenceInputElement.oninput = () => {
      this.title = this.#sequenceInputElement.value;
    };

    // display overlay and start sequence
    const startButton = /** @type {HTMLButtonElement} */ (document.getElementById('startSequence'));
    startButton.onclick = () => Overlay.playSequence( this.exportSequence() );

    addEventListener('timerUpdated', () => this.#updateEstimatedTime() );
    this.#executionInputElement.onValueChange = () => this.#updateEstimatedTime();
  }
}
