// @ts-check
import { Overlay } from "./overlay.js";
import { Timer } from "./timer.js";


/**
 * @import { SequenceData } from "./sequenceStorage.js"
 */


/**
 * Sequence composer.
 */
export const Sequence = new class {

  #sequenceTitle = /** @type {HTMLLabelElement} */ (document.getElementById('sequenceTitle'));
  #executeCountLabel = /** @type {HTMLLabelElement} */ (document.getElementById('executeCount'));
  #estimatedTimeLabel = /** @type {HTMLLabelElement} */ (document.getElementById('estimatedTime'));

  constructor() {
    this.#initEvents()
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
    this.updateEstimatedTime();
  }

  get totalExecutions() {
    return Number(this.#executeCountLabel.textContent);
  }

  /**
   * Import previous sequence.
   * @param {string} name Sequence name.
   * @param {SequenceData} sequence Sequence data.
   */
  importSequence(name, sequence) {
    const sequencerElement = /** @type {HTMLDivElement} */ (document.getElementById('sequencer'));

    this.title = name;
    this.totalExecutions = sequence.executions;

    for (const timer of sequence.timers) {
      const { label, type, time } = timer
      
      const newTimer = /** @type {Timer} */ (document.createElement('timer-item'))
      newTimer.label = label
      newTimer.type = type
      newTimer.time = Number(time)
      
      sequencerElement.appendChild(newTimer)
    }

    // select last
    Timer.all[Timer.all.length - 1].select();
  }

  /**
   * Export current sequence.
   * @returns {SequenceData}
   */
  exportSequence() {
    return {
      executions: this.totalExecutions,
      timers: Timer.all.map((timer) => ({
        label: timer.label,
        type: timer.type,
        time: timer.time
      }))
    };
  }

  /**
   * Update estimated sequence duration as show on screen.
   */
  updateEstimatedTime() {
    let timeInSecs = 0;
    Timer.all.forEach(timer => timeInSecs += timer.time);

    const HMS = Timer.secondsToHMSshort(timeInSecs * this.totalExecutions);
    this.#estimatedTimeLabel.textContent = HMS;
  }

  #initEvents() {
    // change sequence execution count
    const executeFrame = /** @type {HTMLButtonElement} */ (document.getElementById('executeFrame'))
    executeFrame.addEventListener('wheel', (ev) => {
      this.totalExecutions += ev.deltaY < 0 ? 1 : -1
    })

    // display overlay and start sequence
    const startSequenceBtn = /** @type {HTMLButtonElement} */ (document.getElementById('startSequenceBtn'))
    startSequenceBtn.onclick = () => {
      Overlay.restore()
      Overlay.toggle(true)
      Overlay.play()
    }
    
    addEventListener('timerUpdated', () => this.updateEstimatedTime() );
  }
}
