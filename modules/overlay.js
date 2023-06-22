/**
 * Display timer sequence state on screen, control flow.
 */
const Overlay = new class {
  #audioPlayer; #ctrlBtnNext; #ctrlBtnPrev; #ctrlBtnToggle; #ctrlBtnAdd

  constructor() {
    this.overlayElement = document.getElementById('overlay')
    this.#audioPlayer = document.createElement('audio')
    this.#ctrlBtnNext = document.getElementById('ctrlNext')
    this.#ctrlBtnPrev = document.getElementById('ctrlPrev')
    this.#ctrlBtnToggle = document.getElementById('ctrlToggle')
    this.#ctrlBtnAdd = document.getElementById('ctrlAdd')
    this.#initEvents()
  }

  /**
   * Toggle overlay visibility.
   * @param {Boolean} show Either to force Overlay on or off.
   * @param {Number} duration Fade-in/fade-out animation duration.
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

      this.#ctrlBtnToggle.textContent = Sequence.running ? '⏸️' : '▶️'
    })

    // show end screen
    addEventListener('sequenceFinished', (ev) => {
      const { elapsedTime, consumedTime } = ev.detail
      document.title = `${Sequence.title} - Finished`

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
      Sequence.restore()
      this.toggle(false)
    }

    // sequence control
    this.#ctrlBtnPrev.onclick = () => {
      Sequence.skip(false)
    }
    this.#ctrlBtnNext.onclick = () => {
      Sequence.skip(true)
    }
    this.#ctrlBtnToggle.onclick = () => {
      Sequence.running ? Sequence.pause() : Sequence.play()
      this.#ctrlBtnToggle.textContent = Sequence.running ? '⏸️' : '▶️'
    }
    this.#ctrlBtnAdd.onclick = () => Sequence.totalExecutions += 1
  }

}