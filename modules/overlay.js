/**
 * Display timer sequence state on screen, control flow.
 */
const Overlay = new class {
  #audioPlayer; #historyDiv; #ctrlBtnNext; #ctrlBtnPrev; #ctrlBtnToggle; #ctrlBtnAdd
  #checkinTime; #checkoutTime

  constructor() {
    this.overlayElement = document.getElementById('overlay')
    this.#historyDiv = document.getElementById('overlayHist')
    this.#audioPlayer = document.createElement('audio')
    this.#ctrlBtnNext = document.getElementById('ctrlNext')
    this.#ctrlBtnPrev = document.getElementById('ctrlPrev')
    this.#ctrlBtnToggle = document.getElementById('ctrlToggle')
    this.#ctrlBtnAdd = document.getElementById('ctrlAdd')
    this.#initEvents()

    this.#checkinTime = 0
    this.#checkoutTime = 0
  }

  /**
   * Toggle overlay visibility.
   * @param {Boolean} show Either to force Overlay on or off.
   * @param {Number} duration Fade-in/fade-out animation duration.
   */
  toggle(show = true, duration = 150) {

    // reset state
    if (show) {
      this.#historyDiv.textContent = ''
      this.#ctrlBtnPrev.disabled = true
      this.#ctrlBtnNext.disabled = false
      this.#ctrlBtnToggle.disabled = false
      this.#ctrlBtnAdd.disabled = false
    } else {
      document.title = 'Time Sequencer'
      this.#audioPlayer.pause()
    }

    this.overlayElement.style.display = ''
    this.overlayElement.style.opacity = 1
    this.overlayElement.animate([
      {opacity: show ? 0 : 1},
      {opacity: show ? 1 : 0}
    ], {
      duration: duration
    }).onfinish = () => {
      this.overlayElement.style.opacity = show ? 1 : 0
      this.overlayElement.style.display = show ? '' : 'none'
    }
  }

  /**
   * Update information on overlay display.
   * @param {String?} label Title label.
   * @param {String?} time Timer counter.
   * @param {String?} icon Timer emoji icon.
   * @param {String?} sequenceState Sequence state descriptor.
   */
  updateInfo(label, time, icon, sequenceState) {
    const [ iconElm, labelElm, sequenceElm, timeElm, bottomElm ] = 
    document.getElementsByClassName('overlayInfo')[0].children

    if (icon) iconElm.textContent = icon
    if (label) labelElm.textContent = label
    if (sequenceState) sequenceElm.textContent = sequenceState
    if (time) timeElm.textContent = time

    const consumedTime = Timer.secondsToHMSshort(Sequence.consumedTime)
    bottomElm.textContent = `Time Consumed: ${consumedTime}`
  }

  /**
   * Notify event.
   * @param {String} text Notification body.
   * @param {String?} icon Path to custom icon.
   * @param {Boolean} force Either to show notification even in window in focus.
   */
  notify(text, icon, force = false) {
    if (document.hasFocus() && !force) return
    new Notification(`${Sequence.title}`, {
      body: text,
      icon: icon ? icon : 'icons/icon.png'
    })
  }

  /**
   * Register timer-start on timer history.
   */
  checkinTimer() {
    this.#checkinTime = Date.now()

    // add deadtime if space between checkin and last checkout
    if (this.#historyDiv.lastChild && this.#checkinTime != this.#checkoutTime) {
      this.#addDeadTime(this.#checkoutTime, this.#checkinTime)
    }

  }

  /**
   * Register timer-end on timer history.
   * @param {String} label Timer counter state descriptor.
   */
  checkoutTimer(label) {
    const nextCheckoutTime = Date.now()
    
    // if no checkin has been made (checkinTime is -1), add deadtime
    if (this.#checkinTime === -1 && this.#checkoutTime != nextCheckoutTime) {
      this.#addDeadTime(this.#checkoutTime, nextCheckoutTime)
      this.#checkinTime = nextCheckoutTime
    }

    this.#checkoutTime = nextCheckoutTime


    const checkinHour = new Date(this.#checkinTime).toString().split(' ')[4]
    const checkoutHour = new Date(this.#checkoutTime).toString().split(' ')[4]

    let delta = ( this.#checkoutTime - this.#checkinTime ) / 1000
    delta = Timer.secondsToHMSshort(delta)
    const timeSession = `${checkinHour} - ${checkoutHour} (${delta})`

    
    const timerEntry = document.createElement('p')
    timerEntry.classList = 'overlayHistItem'
    timerEntry.textContent = label
    timerEntry.textContent += `\n${timeSession}`
    
    // temporary workaround till a better implementation
    const icon = !this.nextIcon ? 'timeout' : this.nextIcon
    timerEntry.setAttribute('icon', icon)
    this.nextIcon = ''

    this.#checkinTime = -1 // close checkin
    this.#historyDiv.append(timerEntry)
    timerEntry.scrollIntoView()
  }


  /**
   * Register period of inactivity on timer history.
   * @param {Number} fromDate Start Date value.
   * @param {Number} toDate End Date value.
   */
  #addDeadTime(fromDate, toDate) {
    const previousEntry = this.#historyDiv.lastElementChild
    if (!previousEntry) return
    
    let delta = ( toDate - fromDate) / 1000
    delta = Number(delta.toFixed(0))

    const formattedFromTime = new Date(fromDate).toString().split(' ')[4]
    const formattedToTime = new Date(toDate).toString().split(' ')[4]
    
    if (formattedFromTime === formattedToTime) return

    const deltaEntry = document.createElement('p')
    deltaEntry.classList = 'overlayHistItem'
    deltaEntry.style.background = 'none'
    deltaEntry.style.boxShadow = 'none'
    deltaEntry.setAttribute('icon', 'deadtime')

    const duration = Timer.secondsToHMSshort(delta)

    deltaEntry.textContent = `Dead time\n${formattedFromTime} - ${formattedToTime} (${duration})`
    this.#historyDiv.append(deltaEntry)
  }

  #initEvents() {
    // update timer info
    addEventListener('timerTick', (ev) => {
      const { currentTime, label } = ev.detail

      const timeFormated = Timer.secondsToHMS(currentTime)
      document.title = `${label} [${timeFormated}]`
      this.updateInfo(label, timeFormated)
    })

    // notify start
    addEventListener('timerStart', (ev) => {
      const { currentTime, label } = ev.detail

      const timeFormated = Timer.secondsToHMS(currentTime)
      document.title = `${label} [${timeFormated}]`
      this.updateInfo(label, timeFormated, '⏱️')

      this.notify(`${label} Started.`)
    })

    // play song on timer finish
    addEventListener('timerFinished', (ev) => {
      this.#audioPlayer.src = 'sfx/alarm.ogg'
      this.#audioPlayer.play()
    })

    // sequence state
    addEventListener('sequenceTick', (ev) => {
      const { currentTimer, totalTimer, currentExecution, 
      totalExecution, elapsedTime } = ev.detail

      const seqState = `sequence: ${currentExecution}/${totalExecution} 
      timer: ${currentTimer +1}/${totalTimer +1}`

      this.#ctrlBtnPrev.disabled = currentTimer === 0 || currentTimer === totalTimer

      this.updateInfo(null, null, null, seqState)
    })

    // show end screen
    addEventListener('sequenceFinished', (ev) => {
      const { elapsedTime, consumedTime } = ev.detail
      document.title = `Time Sequencer - Finished`

      let elapsed = Timer.secondsToHMSshort(elapsedTime)
      const consumed = Timer.secondsToHMSshort(consumedTime)
      elapsed = `Total Time: ${consumed ? consumed : '0s'}`
      this.updateInfo('Finished', elapsed, '🏆')
      this.notify(`Sequence finished.`)

      this.#ctrlBtnPrev.disabled = true
      this.#ctrlBtnNext.disabled = true
      this.#ctrlBtnToggle.disabled = true
      this.#ctrlBtnAdd.disabled = true
    })

    // close overlay
    const overlayCloseBtn = document.getElementById('overlayCloseBtn')
    overlayCloseBtn.onclick = () => {
      Sequence.stop()
      Sequence.restore()
      this.toggle(false)
    }

    // sequence control
    this.#ctrlBtnPrev.onclick = () => {
      this.nextIcon = 'skipPrev'
      Sequence.skip(false)
    }
    this.#ctrlBtnNext.onclick = () => {
      this.nextIcon = 'skipNext'
      Sequence.skip(true)
    }
    this.#ctrlBtnToggle.onclick = () => {
      if (Sequence.running) this.nextIcon = 'paused'
      Sequence.running ? Sequence.stop() : Sequence.start()
      this.#ctrlBtnToggle.textContent = Sequence.running ? '⏸️' : '⏯️'
    }
    this.#ctrlBtnAdd.onclick = () => Sequence.totalExecutions += 1
  }

}