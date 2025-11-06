// @ts-check
import { Sequence } from "./sequence.js";
import { SequencePlayer } from "./sequencePlayer.js";
import { TimerHistory } from "./timerHistory.js";
import { secondsToHMS, secondsToHMSshort } from "./timeUtils.js";


/**
 * @import { SequenceData } from "./sequenceStorage.js"
 */


/**
 * Display timer sequence state on screen, control flow.
 */
export const Overlay = new class {

  #audioPlayer     = /** @type {HTMLAudioElement}  */ (document.createElement('audio'));
  #ctrlBtnNext     = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlNext'));
  #ctrlBtnPrev     = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlPrev'));
  #ctrlBtnToggle   = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlToggle'));
  #ctrlBtnAdd      = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlAdd'));
  #overlayCloseBtn = /** @type {HTMLButtonElement} */ (document.getElementById('closeOverlay'));
  #overlayElement  = /** @type {HTMLDivElement}    */ (document.getElementById('overlay'));

  #checkoutIcon = 'timeout';
  #consumedTime = 0;

  /**
   * @type {SequencePlayer}
   */
  #sequencePlayer;

  constructor() {
    this.#initEvents();
  }

  /**
   * Set and start overlay sequence player.
   * @param {SequenceData} sequence Sequence data.
   */
  playSequence(sequence) {
    const player = new SequencePlayer(sequence);
    this.#sequencePlayer = player;
    this.#consumedTime = 0;

    player.addEventListener('timerTick', () => this.#onTick() );
    player.addEventListener('timerStart', () => this.#onStart() );
    player.addEventListener('timerPause', () => this.#onPause() );
    player.addEventListener('timerFinished', () => this.#onTimerFinished() );
    player.addEventListener('sequenceFinished', () => this.#onSequenceFinished() );
    player.addEventListener('extendExecution', () => this.#onExtendExecution() );

    this.#sequencePlayer.start();
    this.#toggle(true);
  }

  /**
   * Toggle overlay visibility.
   * @param {boolean} show Either to force Overlay on or off.
   * @param {number} duration Fade-in/fade-out animation duration.
   */
  #toggle(show = true, duration = 150) {
    this.#overlayElement.style.display = '';

    // reset state
    if (show) {
      this.#updateControls();
    } else {
      document.title = 'Time Sequencer';
      this.#audioPlayer.pause();
      TimerHistory.clear();
    }

    this.#overlayElement.animate([
      { opacity: 0 }, { opacity: 1 }
    ], {
      duration: duration,
      direction: show ? 'normal' : 'reverse'
    }).onfinish = () => {
      this.#overlayElement.style.display = show ? '' : 'none';
    };
  }

  /**
   * @typedef InfoObject
   * @property {string} [icon]
   * @property {string} [primaryTitle]
   * @property {string} [description]
   * @property {string} [secondaryTitle]
   */

  /**
   * Update information on overlay display.
   * @param {InfoObject} [info] Object overrides.
   */
  #updateInfo(info = {}) {
    const [ iconElm, labelElm, sequenceElm, timeElm, bottomElm ] = 
      document.getElementsByClassName('overlayInfo')[0].children;

    if (info.icon) iconElm.textContent = info.icon;
    if (info.primaryTitle) labelElm.textContent = info.primaryTitle;
    if (info.description) sequenceElm.textContent = info.description;
    if (info.secondaryTitle) timeElm.textContent = info.secondaryTitle;

    const consumedTime = secondsToHMSshort(this.#consumedTime);
    bottomElm.textContent = `Time Consumed: ${consumedTime}`;
  }

  /**
   * Register current timer end on Overlay timer history with a formatted state message.
   */
  #checkoutTimer() {
    const info = this.#sequencePlayer.info;

    // add to overlay history
    const progress = info.timerType === 'Count-Up'
      ? secondsToHMSshort(info.timerValue)
      : `${secondsToHMSshort(info.timerTotal - info.timerValue)} of ${secondsToHMSshort(info.timerTotal)}`;

    const label = `${info.timerLabel}\n${progress}`;
    TimerHistory.checkoutTimer(label, this.#checkoutIcon);
  }

  #updateControls() {
    const info = this.#sequencePlayer.info;

    this.#ctrlBtnToggle.textContent = info.running ? '⏸️' : '▶️';
    this.#ctrlBtnPrev.disabled = info.executionValue === 1;
    this.#ctrlBtnNext.disabled = info.finished;
    this.#ctrlBtnToggle.disabled = false;
    this.#ctrlBtnAdd.disabled = false;
  }

  #onTick() {
    this.#consumedTime++;
    const info = this.#sequencePlayer.info;

    const timeFormated = secondsToHMS(info.timerValue);
    document.title = `${info.timerLabel} [${timeFormated}]`;

    this.#updateInfo({
      primaryTitle: info.timerLabel,
      secondaryTitle: timeFormated
    });
  }

  #onStart() {
    this.#checkoutIcon = 'timeout';
    TimerHistory.checkinTimer();

    const info = this.#sequencePlayer.info;

    const timeFormated = secondsToHMS(info.timerValue);
    document.title = `${info.timerLabel} [${timeFormated}]`;

    const seqState = `sequence: ${info.executionValue}/${info.executionTotal} 
    timer: ${info.timerIndexValue +1}/${info.timerIndexTotal}`;
    
    this.#updateInfo({
      icon: '⏱️',
      primaryTitle: info.timerLabel,
      secondaryTitle: timeFormated,
      description: seqState
    });

    this.#updateControls();
  }

  #onPause() {
    this.#checkoutIcon = 'paused';
    this.#checkoutTimer();

    this.#updateControls();
  }

  #onExtendExecution() {
    const info = this.#sequencePlayer.info;

    const seqState = `sequence: ${info.executionValue}/${info.executionTotal} 
    timer: ${info.timerIndexValue +1}/${info.timerIndexTotal}`;

    this.#updateInfo({ description: seqState });
    this.#updateControls();
  }

  #onTimerFinished() {
    const info = this.#sequencePlayer.info;
    this.#checkoutTimer();

    this.#audioPlayer.src = 'sfx/alarm.ogg';
    this.#audioPlayer.play();

    const seqState = `sequence: ${info.executionValue}/${info.executionTotal} 
    timer: ${info.timerIndexValue +1}/${info.timerIndexTotal}`;
    
    this.#updateInfo({ description: seqState });
    this.#updateControls();
  }

  #onSequenceFinished() {
    document.title = `${Sequence.title} - Finished`;

    const consumed = secondsToHMSshort(this.#consumedTime);
    const totalTime = `Total Time: ${consumed ? consumed : '0s'}`;

    this.#updateInfo({
      icon: '🏆',
      primaryTitle: 'Finished',
      secondaryTitle: totalTime,
    });
    
    this.#ctrlBtnPrev.disabled = true;
    this.#ctrlBtnNext.disabled = true;
    this.#ctrlBtnToggle.disabled = true;
    this.#ctrlBtnAdd.disabled = true;
  }

  #initEvents() {
    // close overlay
    this.#overlayCloseBtn.onclick = () => {
      this.#sequencePlayer.restoreSequence();
      this.#toggle(false);
    };

    // sequence control
    this.#ctrlBtnPrev.onclick = () => {
      this.#checkoutIcon = 'skipPrev';
      this.#sequencePlayer.skip(false);
    };

    this.#ctrlBtnNext.onclick = () => {
      this.#checkoutIcon = 'skipNext';
      this.#sequencePlayer.skip(true);
    };

    this.#ctrlBtnToggle.onclick = () => {
      const running = this.#sequencePlayer.info.running;

      running
        ? this.#sequencePlayer.pause()
        : this.#sequencePlayer.start();
    }

    this.#ctrlBtnAdd.onclick = () => {
      this.#sequencePlayer.extendExecution();
    };
  }
}
