/**
 * Runtime timer sequence. Should have one global instance only.
 */
const Sequence = new class {

  #execution; #currentIdx; #sequenceTitle

  constructor() {
    this.#currentIdx = 0
    this.executionSet = 1
    this.#execution = 1
    this.running = false
    this.begun = false // on first run and restore 
    this.begunTime = null
    this.consumedTime = 0
    this.#sequenceTitle = document.getElementById('sequenceTitle')
    this.#initListeners()
  }

  /**
   * Start timer sequence.
   * @returns {Boolean} False on failure.
   */
  start() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false

    Overlay.checkinTimer()

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
   * Register current timer end on Overlay timer history with a formatted state message.
   */
  #checkoutTimer() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return

    // add to overlay history
    const progress = currentTimer.type === 'Count-Up' ? Timer.secondsToHMSshort(currentTimer.consumedTime) :
    `${Timer.secondsToHMSshort(currentTimer.consumedTime)} of ${Timer.secondsToHMSshort(currentTimer.time)}`
    
    const label = `${currentTimer.label}\n${progress}`
    Overlay.checkoutTimer(label)
  }

  /**
   * Pause current timer.
   * @returns {Boolean} False on failure.
   */
  stop() {
    const currentTimer = Timer.all[this.#currentIdx]
    if (!currentTimer) return false

    this.#checkoutTimer()

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

    // simple skip
    if (next) {
      currentTimer.onfinish()
    }

    // not next, simple backward
    else if (!isFirstTimer) {
      this.stop()
      this.#currentIdx--
      this.start()
    }
    
    // not next, previous sequence
    else if (this.#execution > 1) {
      this.stop()
      this.#currentIdx = Timer.all.length -1
      this.#execution--
      Timer.all.forEach(timer => timer.restore())
      this.start()
    }
    
    this.#signal()
  }

  /**
   * Restore sequence and timers to a clean state.
   */
  restore() {
    this.#currentIdx = 0
    this.#execution = 1
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
      currentExecution: this.#execution,
      totalExecution: this.executionSet,
      elapsedTime: this.elapsedTime,
      consumedTime: this.consumedTime
    }})
    dispatchEvent(ev)
    console.log(customSignal) 
  }

  #initListeners() {

    // skip to next timer, execution or end sequence
    addEventListener('timerFinished', () => {
      const isLastTimer = this.#currentIdx == (Timer.all.length - 1)
      const isLastExecution = this.#execution == this.executionSet

      this.#checkoutTimer()

      // restore state and finish sequence
      if (isLastTimer && isLastExecution) {
        this.#signal('sequenceFinished')
        return
      }

      // move execution
      if (isLastTimer) {
        this.#execution++
        this.#currentIdx = 0
        Timer.all.forEach(timer => timer.restore())
        this.#signal() // (repeat)
        console.log(`sequenceRepeat: ${this.#execution}/${this.executionSet}`)
        this.start()
        return
      }

      // next timer
      this.#currentIdx++
      this.#signal()
      this.start()
    })


    // change sequence execution count
    const executeFrame = document.getElementById('executeFrame')
    const executeCount = document.getElementById('executeCount')
    executeFrame.addEventListener('wheel', (ev) => {
      const delta = ev.deltaY < 0 ? 1 : -1
      Sequence.executionSet = Math.max(1, Sequence.executionSet + delta)
      executeCount.textContent = `x${Sequence.executionSet}`
      this.updateEstimatedTime()
    })

    // save current sequence and repopulate SequenceList
    const sequenceSaveBtn = document.getElementById('sequenceSave')
    sequenceSaveBtn.onclick = () => {
      Sequence.storeSequence()
      SequenceList.populate()
    }

    // display overlay and start sequence
    const startSequenceBtn = document.getElementById('startSequenceBtn')
    startSequenceBtn.onclick = () => {
      Sequence.restore()
      Overlay.toggle(true)
      Sequence.start()
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

    estimatedTime.textContent = Timer.secondsToHMSshort( timeInSecs * this.executionSet )
  }

  /**
   * Store all timer items as a named sequence in localStorage.
   */
  storeSequence() {
    const saveName = this.#sequenceTitle.textContent
    if (!saveName) return

    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage) sequenceStorage = {}

    sequenceStorage[saveName] = []
    for (const timerItem of Timer.all) {
      sequenceStorage[saveName].push({
        label: timerItem.label,
        type: timerItem.type,
        time: timerItem.time,
      })
    }

    localStorage.setItem('sequenceStorage', JSON.stringify(sequenceStorage))
    console.log(`saved timer items as ${saveName}`);
  }

  /**
   * Restore all timer items from a named sequence in localStorage.
   * @param {String} loadName Stored sequence name.
   */
  loadSequence(loadName) {
    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage || !sequenceStorage[loadName]) {
      return console.log(`no items to load from ${loadName}`)
    }

    // remove current items (iterate backwards to workaround re-indexing)
    for (let i = Timer.all.length - 1; i >= 0; i--) {
      const element = Timer.all[i];
      element.remove()
    }

    // restore saved items
    for (const storedTimer of sequenceStorage[loadName]) {
      const { label, type, time } = storedTimer

      const newTimer = document.createElement('timer-item')
      newTimer.label = label
      newTimer.type = type
      newTimer.time = Number(time)

      document.getElementById('sequencer').appendChild(newTimer)
    }
    
    // select last
    Timer.all[Timer.all.length - 1].select()
    this.#sequenceTitle.textContent = loadName
    console.log(`loaded timer items from ${loadName}`)
  }
}