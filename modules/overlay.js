// @ts-check
import { Sequence } from "./sequence.js";
import { Timer } from "./timer.js";
import { TimerHistory } from "./timerHistory.js";


/**
 * Display timer sequence state on screen, control flow.
 */
export const Overlay = new class {

  #audioPlayer     = /** @type {HTMLAudioElement}  */ (document.createElement('audio'));
  #ctrlBtnNext     = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlNext'));
  #ctrlBtnPrev     = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlPrev'));
  #ctrlBtnToggle   = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlToggle'));
  #ctrlBtnAdd      = /** @type {HTMLButtonElement} */ (document.getElementById('ctrlAdd'));
  #overlayCloseBtn = /** @type {HTMLButtonElement} */ (document.getElementById('overlayCloseBtn'));
  #overlayElement  = /** @type {HTMLDivElement}    */ (document.getElementById('overlay'));

  #checkoutIcon = 'timeout';
  #currentIdx = 0;
  #totalExecutions = 1;
  #currentExecution = 1;
  #consumedTime = 0;
  #running = false;
  #begun = false; // on first run and restore 
  #begunTime = null;

  constructor() {
    this.#initEvents();
  }

  /**
   * Toggle overlay visibility.
   * @param {boolean} show Either to force Overlay on or off.
   * @param {number} duration Fade-in/fade-out animation duration.
   */
  toggle(show = true, duration = 150) {

    // reset state
    if (show) {
      TimerHistory.clear()
      this.#ctrlBtnPrev.disabled = true
      this.#ctrlBtnNext.disabled = false
      this.#ctrlBtnToggle.disabled = false
      this.#ctrlBtnAdd.disabled = false
    } else {
      document.title = 'Time Sequencer'
      this.#audioPlayer.pause()
    }

    this.#overlayElement.style.display = ''
    this.#overlayElement.style.opacity = '1'
    this.#overlayElement.animate([
      {opacity: show ? 0 : 1},
      {opacity: show ? 1 : 0}
    ], {
      duration: duration
    }).onfinish = () => {
      this.#overlayElement.style.opacity = show ? '1' : '0'
      this.#overlayElement.style.display = show ? '' : 'none'
    }
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
  updateInfo(info = {}) {
    const [ iconElm, labelElm, sequenceElm, timeElm, bottomElm ] = 
      document.getElementsByClassName('overlayInfo')[0].children;

    if (info.icon) iconElm.textContent = info.icon;
    if (info.primaryTitle) labelElm.textContent = info.primaryTitle;
    if (info.description) sequenceElm.textContent = info.description;
    if (info.secondaryTitle) timeElm.textContent = info.secondaryTitle;

    const consumedTime = Timer.secondsToHMSshort(this.#consumedTime);
    bottomElm.textContent = `Time Consumed: ${consumedTime}`;
  }

  /**
   * play sequence and log deadtime, if any.
   * @returns {boolean} False on failure.
   */
  play() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false
      
      this.#checkoutIcon = 'timeout'
      TimerHistory.checkinTimer()
      
      currentTimer.start()
      this.#running = true
      
      // first run
      if (!this.#begun) {
        this.#begun = true
        this.#begunTime = Date.now()
        this.#totalExecutions = Sequence.exportSequence().executions;
        this.#signal()
      }
      
      return true
  }
  
  /**
   * Pause sequence and log event.
   */
  pause() {
    this.#stop()
    
    this.#checkoutIcon = 'paused'
    this.#checkoutTimer()
  }

  /**
   * Freeze sequence in current state.
   * @returns {boolean} False on failure.
   */
  #stop() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false
    
    currentTimer.stop()
    this.#running = false
    return true
  }
  
  /**
   * Skip to next/previous timer and execution loop.
   * @param {boolean} next Either to skip forward or backwards.
   */
  skip(next = true) {
    const currentTimer = Timer.all[this.#currentIdx]
    const isFirstTimer = this.#currentIdx == 0
    this.#checkoutIcon = next ? 'skipNext' : 'skipPrev'
    
    // simple skip
    if (next) {
      currentTimer.onfinish()
    }
    
    // not next, simple backward
    else if (!isFirstTimer) {
      this.#stop()
      this.#currentIdx--
      this.play()
    }
    
    // not next, previous sequence
    else if (this.#currentExecution > 1) {
      this.#stop()
      this.#currentIdx = Timer.all.length -1
      this.#currentExecution--
      Timer.all.forEach(timer => timer.restore())
      this.play()
    }
    
    this.#signal()
  }

  /**
   * Register current timer end on Overlay timer history with a formatted state message.
   */
  #checkoutTimer() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return
    
    // add to overlay history
    const progress = currentTimer.type === 'Count-Up'
      ? Timer.secondsToHMSshort(currentTimer.consumedTime)
      : `${Timer.secondsToHMSshort(currentTimer.consumedTime)} of ${Timer.secondsToHMSshort(currentTimer.time)}`
    
    const label = `${currentTimer.label}\n${progress}`
    TimerHistory.checkoutTimer(label, this.#checkoutIcon)
  }
  
  /**
   * Stop & restore sequence and timers to a clean state.
   */
  restore() {
    this.#stop()
    
    this.#currentIdx = 0
    this.#currentExecution = 1
    Timer.all.forEach(timer => timer.restore())
    this.#begun = false
    this.#begunTime = null
    this.#consumedTime = 0
    console.log('sequenceRestore');
  }
  
  /**
   * Time since sequence started, in seconds.
   */
  get elapsedTime() {
    return this.#begun
      ? (Date.now() - this.#begunTime) / 1000
      : 0;
  }

  #signal(customSignal = 'sequenceTick') {
    const ev = new CustomEvent(customSignal );
    dispatchEvent(ev);
    console.log(customSignal) 
  }

  /**
   * Notify event.
   * @param {string} text Notification body.
   * @param {string} [icon] Path to custom icon.
   * @param {boolean} [force] Either to show notification even in window in focus.
   */
  notify(text, icon, force = false) {
    if (document.hasFocus() && !force) return
    new Notification(`${Sequence.title}`, {
      body: text,
      icon: icon ? icon : 'icons/icon.png'
    })
  }

  #initEvents() {
    // skip to next timer, execution or end sequence
    addEventListener('timerFinished', () => {
      const isLastTimer = this.#currentIdx == (Timer.all.length - 1)
      const isLastExecution = this.#currentExecution == this.#totalExecutions
      
      this.#checkoutTimer()
      
      // restore state and finish sequence
      if (isLastTimer && isLastExecution) {
        this.#signal('sequenceFinished')
        return
      }
      
      // move execution
      if (isLastTimer) {
        this.#currentExecution++
        this.#currentIdx = 0
        Timer.all.forEach(timer => timer.restore())
        this.#signal() // (repeat)

        console.log(`sequenceRepeat: ${this.#currentExecution}/${this.#totalExecutions}`)
        this.play()
        return
      }
      
      // next timer
      this.#currentIdx++
      this.#signal()
      this.play()
    })

    // update timer info
    addEventListener('timerTick', (ev) => {
      const { currentTime, label } = ev.detail;

      this.#consumedTime++;
      const timeFormated = Timer.secondsToHMS(currentTime);
      document.title = `${label} [${timeFormated}]`;

      this.updateInfo({
        primaryTitle: label,
        secondaryTitle: timeFormated
      });
    })

    // notify start
    addEventListener('timerStart', (ev) => {
      const { currentTime, label } = ev.detail;

      const timeFormated = Timer.secondsToHMS(currentTime);
      document.title = `${label} [${timeFormated}]`;

      this.updateInfo({
        icon: '⏱️',
        primaryTitle: label,
        secondaryTitle: timeFormated
      });

      this.notify(`${label} Started.`);
    })

    // play song on timer finish
    addEventListener('timerFinished', (ev) => {
      this.#audioPlayer.src = 'sfx/alarm.ogg'
      this.#audioPlayer.play()
    })

    // sequence state
    addEventListener('sequenceTick', () => {
      const seqState = `sequence: ${this.#currentExecution}/${this.#totalExecutions} 
        timer: ${this.#currentIdx +1}/${Timer.all.length}`;

      this.#ctrlBtnPrev.disabled = this.#currentIdx === 0 || this.#currentIdx === Timer.all.length - 1;

      this.updateInfo({ description: seqState });

      this.#ctrlBtnToggle.textContent = this.#running ? '⏸️' : '▶️';
    })

    // show end screen
    addEventListener('sequenceFinished', (ev) => {
      document.title = `${Sequence.title} - Finished`

      let elapsed = Timer.secondsToHMSshort(this.elapsedTime)
      const consumed = Timer.secondsToHMSshort(this.#consumedTime)
      elapsed = `Total Time: ${consumed ? consumed : '0s'}`

      this.updateInfo({
        icon: '🏆',
        primaryTitle: 'Finished',
        secondaryTitle: elapsed
      });

      this.notify(`Sequence finished.`)

      this.#ctrlBtnPrev.disabled = true
      this.#ctrlBtnNext.disabled = true
      this.#ctrlBtnToggle.disabled = true
      this.#ctrlBtnAdd.disabled = true
    })

    // close overlay
    this.#overlayCloseBtn.onclick = () => {
      this.restore()
      this.toggle(false)
    }

    // sequence control
    this.#ctrlBtnPrev.onclick = () => this.skip(false);

    this.#ctrlBtnNext.onclick = () => this.skip(true);

    this.#ctrlBtnToggle.onclick = () => {
      this.#running ? this.pause() : this.play()
      this.#ctrlBtnToggle.textContent = this.#running ? '⏸️' : '▶️'
    }

    this.#ctrlBtnAdd.onclick = () => {
      const seqState = `sequence: ${this.#currentExecution}/${++this.#totalExecutions} 
        timer: ${this.#currentIdx +1}/${Timer.all.length}`;

      this.updateInfo({ description: seqState });
    };
  }
}
