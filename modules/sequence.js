/**
 * Runtime timer sequence. Should have one global instance only.
 */
const Sequence = new class {

  #totalExecutions; currentExecution; #currentIdx; #checkoutIcon = 'timeout'

  constructor() {
    this.#currentIdx = 0
    this.#totalExecutions = 1
    this.currentExecution = 1
    this.running = false
    this.begun = false // on first run and restore 
    this.begunTime = null
    this.consumedTime = 0
    this.#initEvents()
  }

  /**
   * Sequence title.
   * @param {String} value
   */
  set title(value) {
    const titleInput = document.getElementById('sequenceTitle')
    titleInput.textContent = value
  }

  get title() {
    const titleInput = document.getElementById('sequenceTitle')
    return titleInput.textContent
  }

  /**
   * Times the sequence should be executed.
   * @param {Number} value
   */
  set totalExecutions(value) {
    this.#totalExecutions = Math.max(1, value)

    // update DOM elements
    const executeCount = document.getElementById('executeCount')
    executeCount.textContent = Sequence.#totalExecutions
    this.updateEstimatedTime()

    if (this.begun) {
      this.#signal()
    }
  }

  get totalExecutions() {
    return this.#totalExecutions
  }

  /**
   * play sequence and log deadtime, if any.
   * @returns {Boolean} False on failure.
   */
  play() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false

    this.#checkoutIcon = 'timeout'
    TimerHistory.checkinTimer()

    currentTimer.start()
    this.running = true

    // first run
    if (!this.begun) {
      this.begun = true
      this.begunTime = Date.now()
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
   * Register current timer end on Overlay timer history with a formatted state message.
   */
  #checkoutTimer() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return

    // add to overlay history
    const progress = currentTimer.type === 'Count-Up' ? Timer.secondsToHMSshort(currentTimer.consumedTime) :
    `${Timer.secondsToHMSshort(currentTimer.consumedTime)} of ${Timer.secondsToHMSshort(currentTimer.time)}`
    
    const label = `${currentTimer.label}\n${progress}`
    TimerHistory.checkoutTimer(label, this.#checkoutIcon)
  }

  /**
   * Freeze sequence in current state.
   * @returns {Boolean} False on failure.
   */
  #stop() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false

    currentTimer.stop()
    this.running = false
    return true
  }

  /**
   * Skip to next/previous timer and execution loop.
   * @param {Boolean} next Either to skip forward or backwards.
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
    else if (this.currentExecution > 1) {
      this.#stop()
      this.#currentIdx = Timer.all.length -1
      this.currentExecution--
      Timer.all.forEach(timer => timer.restore())
      this.play()
    }
    
    this.#signal()
  }

  /**
   * Stop & restore sequence and timers to a clean state.
   */
  restore() {
    this.#stop()

    this.#currentIdx = 0
    this.currentExecution = 1
    Timer.all.forEach(timer => timer.restore())
    this.begun = false
    this.begunTime = null
    this.consumedTime = 0
    console.log('sequenceRestore');
  }

  /**
   * Time since sequence started, in seconds.
   */
  get elapsedTime() {
    return this.begun ? ((Date.now() - this.begunTime) / 1000) : 0
  }

  #signal(customSignal = 'sequenceTick') {
    const ev = new CustomEvent(customSignal, {detail: {
      currentTimer: this.#currentIdx,
      totalTimer: Timer.all.length -1,
      currentExecution: this.currentExecution,
      totalExecution: this.totalExecutions,
      elapsedTime: this.elapsedTime,
      consumedTime: this.consumedTime
    }})
    dispatchEvent(ev)
    console.log(customSignal) 
  }

  #initEvents() {

    // skip to next timer, execution or end sequence
    addEventListener('timerFinished', () => {
      const isLastTimer = this.#currentIdx == (Timer.all.length - 1)
      const isLastExecution = this.currentExecution == this.#totalExecutions

      this.#checkoutTimer()

      // restore state and finish sequence
      if (isLastTimer && isLastExecution) {
        this.#signal('sequenceFinished')
        return
      }

      // move execution
      if (isLastTimer) {
        this.currentExecution++
        this.#currentIdx = 0
        Timer.all.forEach(timer => timer.restore())
        this.#signal() // (repeat)
        console.log(`sequenceRepeat: ${this.currentExecution}/${this.#totalExecutions}`)
        this.play()
        return
      }

      // next timer
      this.#currentIdx++
      this.#signal()
      this.play()
    })


    // change sequence execution count
    const executeFrame = document.getElementById('executeFrame')
    executeFrame.addEventListener('wheel', (ev) => {
      this.totalExecutions += ev.deltaY < 0 ? 1 : -1
    })

    // save current sequence and repopulate SequenceList
    const sequenceSaveBtn = document.getElementById('sequenceSave')
    sequenceSaveBtn.onclick = () => SequenceList.storeSequence()

    // display overlay and start sequence
    const startSequenceBtn = document.getElementById('startSequenceBtn')
    startSequenceBtn.onclick = () => {
      Sequence.restore()
      Overlay.toggle(true)
      Sequence.play()
    }
  }

  /**
   * Update estimated sequence duration as show on screen.
   * @returns {Number}
   */
  updateEstimatedTime() {
    const estimatedTime = document.getElementById('estimatedTime')

    let timeInSecs = 0
    Timer.all.forEach(timer => timeInSecs += timer.time)

    estimatedTime.textContent = Timer.secondsToHMSshort( timeInSecs * this.#totalExecutions )
  }
}