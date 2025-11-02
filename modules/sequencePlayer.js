// @ts-check

/**
 * @import { SequenceData } from "./sequenceStorage"
 */

/**
 * @typedef TimeSlot
 * @property {number} total Total time to wait. 
 * @property {number} value Time waited.
 */

/**
 * @typedef {'timerTick'|'timerStart'|'timerPause'|'extendExecution'|
 * 'timerFinished'|'sequenceFinished'} SequencePlayerEvents
 */

/**
 * @typedef SequenceInfo
 * @property {boolean} running
 * @property {boolean} finished
 * @property {number} startTime
 * @property {number} executionValue
 * @property {number} executionTotal
 * @property {number} timerIndexValue
 * @property {number} timerIndexTotal
 * @property {number} timerValue
 * @property {string} timerType
 * @property {number} timerTotal
 * @property {string} timerLabel
 */


/**
 * Sequence timer.
 */
export class SequencePlayer {
  
  /**
   * Sequence data.
   * @type {SequenceData}
   */
  #sequence;

  /**
   * Sequence timer time-slot representation.
   * @type {TimeSlot[][]}
   */
  #timeSlots = [];

  /**
   * Current sequence execution.
   */
  #currentExecutionIdx = 0;
  
  /**
   * Current sequence timer index.
   */
  #currentTimerIdx = 0;

  /**
   * Either sequence timer is running.
   */
  #running = false;

  /**
   * Either sequence has been run before.
   */
  #firstRun = true;

  /**
   * Sequence first run time.
   */
  #firstRunTime = 0;

  /**
   * Either sequence has been played to completion.
   */
  #finished = false;

  /**
   * Sequence interval
   * @type {number|undefined}
   */
  #playerInterval;

  /**
   * SequencePlayer event callbacks
   * @type {Object<string, Function[]>}
   */
  #eventCallbacks = {};

  /**
   * Instantiate a sequencer as a timer.
   * @param {SequenceData} sequence Sequence to instantiate.
   */
  constructor(sequence) {
    if (sequence == null)
      throw new Error('Sequence can\'t be undefined.');

    this.#sequence = sequence;

    for (let i = 0; i < sequence.executions; i++) {
      this.#timeSlots[i] = sequence.timers.map((timer) => ({
        total: timer.time,
        value: timer.type === 'Count-Down'
          ? timer.time
          : 0
      }));
    }
  }

  /**
   * Start sequence timer.
   */
  start() {
    if (this.#running || this.#finished)
      return;

    this.#running = true;
    
    this.#playerInterval = setInterval(() => {
      const timer = this.#sequence.timers[this.#currentTimerIdx];
      const slot = this.#timeSlots[this.#currentExecutionIdx][this.#currentTimerIdx];

      timer.type === 'Count-Down'
        ? slot.value--
        : slot.value++;

      this.#fireEvent("timerTick");

      if (timer.type === 'Count-Down' && slot.value <= 0)
        this.#finishTimer();
    }, 1000);

    if (this.#firstRun) {
      this.#firstRun = false;
      this.#firstRunTime = Date.now();
    }

    this.#fireEvent("timerStart");
  }

  /**
   * Pause sequence timer.
   */
  pause() {
    if (!this.#running || this.#finished)
      return;

    this.#running = false;

    clearInterval(this.#playerInterval); 
    this.#playerInterval = undefined;

    this.#fireEvent("timerPause");
  }

  /**
   * Skip sequence by one timer.
   * @param {boolean} [forward=true] Forward by default.
   */
  skip(forward = true) {
    if (this.#finished)
      return;

    if (forward)
      this.#finishTimer();

    // back one timer
    else if (this.#currentTimerIdx > 0) {
      this.pause();
      this.#currentTimerIdx--;
      this.start(); // maybe reset timer before?
    }

    // back one execution
    else if (this.#timeSlots[this.#currentExecutionIdx - 1] != null) {
      this.pause();
      this.#currentExecutionIdx--;
      this.#currentTimerIdx = this.#timeSlots[0].length - 1;
      this.start(); // maybe reset timer before?
    }
  }

  /**
   * Extend execution by one.
   */
  extendExecution() {
    this.#timeSlots[this.#sequence.executions++] = this.#sequence.timers.map((timer) => ({
      total: timer.time,
      value: timer.type === 'Count-Down'
        ? timer.time
        : 0
    }));

    this.#fireEvent('extendExecution');
  }

  /**
   * Restore sequence player to default state.
   */
  restoreSequence() {
    clearInterval(this.#playerInterval); 
    this.#playerInterval = undefined;

    this.#running = false;
    this.#currentTimerIdx = 0;
    this.#currentExecutionIdx = 0;

    this.#finished = false;
    this.#firstRun = true;
    this.#firstRunTime = 0;

    for (let i = 0; i < this.#sequence.executions; i++) {
      this.#timeSlots[i] = this.#sequence.timers.map((timer) => ({
        total: timer.time,
        value: timer.type === 'Count-Down'
          ? timer.time
          : 0
      }));
    }
  }

  /**
   * Run on timer completion.
   */
  #finishTimer() {
    clearInterval(this.#playerInterval); 
    this.#playerInterval = undefined;
    this.#running = false;
    this.#fireEvent("timerFinished");

    // next timer
    if (this.#currentTimerIdx < this.#sequence.timers.length - 1) {
      this.#currentTimerIdx++;
      this.start();
    }
 
    // otherwise, next execution iteration
    else if (this.#currentExecutionIdx < this.#sequence.executions - 1) {
      this.#currentExecutionIdx++;
      this.#currentTimerIdx = 0;
      this.start();
    }

    else {
      this.#fireEvent("sequenceFinished");
      this.#finished = true;
    }
  }

  /**
   * Return SequencePlayer state information.
   * @returns {SequenceInfo}
   */
  get info() {
    const currentTimer = this.#sequence.timers[this.#currentTimerIdx];
    const currentSlot = this.#timeSlots[this.#currentExecutionIdx][this.#currentTimerIdx];

    return {
      running: this.#running,
      finished: this.#finished,
      startTime: this.#firstRunTime,
      executionValue: this.#currentExecutionIdx + 1,
      executionTotal: this.#sequence.executions,
      timerIndexValue: this.#currentTimerIdx,
      timerIndexTotal: this.#sequence.timers.length,
      timerLabel: currentTimer.label,
      timerType: currentTimer.type,
      timerValue: currentSlot.value,
      timerTotal: currentSlot.total
    };
  }

  /**
   * Listen to sequence player events.
   * @param {SequencePlayerEvents} type Event type.
   * @param {Function} callback Event callback.
   */
  addEventListener(type, callback) {
    if (this.#eventCallbacks[type] == null)
      this.#eventCallbacks[type] = [];

    this.#eventCallbacks[type].push(callback);
  }

  /**
   * Fire callbacks for a given SequencePlayer event.
   * @param {SequencePlayerEvents} type Event type.
   */
  #fireEvent(type) {
    const callbacks = this.#eventCallbacks[type];

    if (callbacks != null)
      callbacks.forEach( (callback) => callback() );
  }
}
