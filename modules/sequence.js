// @ts-check
import { Overlay } from "./overlay.js";
import { Timer } from "./timer.js"
import { secondsToHMSshort } from "./timeUtils.js";


/**
 * @import { SequenceData } from "./sequenceStorage.js"
 */


/**
 * Sequence composer.
 */
export const Sequence = new class {

  #sequencer = /** @type {HTMLDivElement} */ (document.getElementById('sequencer'));
  #sequenceTitle = /** @type {HTMLLabelElement} */ (document.getElementById('sequenceTitle'));
  #executeCountLabel = /** @type {HTMLLabelElement} */ (document.getElementById('executeCount'));
  #estimatedTimeLabel = /** @type {HTMLLabelElement} */ (document.getElementById('estimatedTime'));

  constructor() {
    this.#initEvents();
  }

  /**
   * Sequence title.
   * @param {string} value
   */
  set title(value) {
    this.#sequenceTitle.textContent = value;
  }

  get title() {
    return this.#sequenceTitle.textContent;
  }

  /**
   * Times the sequence should be executed.
   * @param {number} value
   */
  set totalExecutions(value) {
    this.#executeCountLabel.textContent = `${Math.max(1, value)}`;
    this.#updateEstimatedTime();
  }

  get totalExecutions() {
    return Number(this.#executeCountLabel.textContent);
  }

  get #allTimers() {
    const timers = /** @type {Timer[]} */ ([...this.#sequencer.children]);
    return timers;
  }

  #newTimer() {
    const timer =  /** @type {Timer} */ (document.createElement('timer-item'));

    timer.onSelect = () => {
      const currentlySelected = this.#sequencer.querySelector('.selectedTimer');
      if (currentlySelected)
        currentlySelected.classList.remove('selectedTimer');

      timer.classList.add('selectedTimer');
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
      timer.time = Number(time);

      this.#sequencer.appendChild(timer);
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
    // change sequence execution count
    const executeFrame = /** @type {HTMLButtonElement} */ (document.getElementById('executeFrame'))
    executeFrame.addEventListener('wheel', (e) => {
      this.totalExecutions += Math.sign(e.deltaY);
    });

    // display overlay and start sequence
    const startSequenceBtn = /** @type {HTMLButtonElement} */ (document.getElementById('startSequenceBtn'))
    startSequenceBtn.onclick = () => Overlay.playSequence( this.exportSequence() );

    addEventListener('timerUpdated', () => this.#updateEstimatedTime() );
  }
}
