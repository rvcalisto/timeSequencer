/**
 * Timer editor panel.
 */
const Editor = new class {

  constructor() {
    this.currentItem
    this.type = document.getElementById('editorType')
    this.label = document.getElementById('editorLabel')
    this.#initEventListeners()
  }

  /**
   * Load timer properties into input elements.
   */
  loadTimer() {
    this.type.value = this.currentItem.type
    this.label.value = this.currentItem.label
    this.#updateHHMMSS()
  }

  /**
   * Update timer properties with editor values and repaint.
   */
  #updateTimer() {
    this.currentItem.type = this.type.value
    this.currentItem.label = this.label.value
    this.currentItem.updateElement()
  }

  /**
   * Increment timer time-count by value.
   * @param {Number} value Value to increment.
   */
  #incrementTimeBy(value) {
    const newTime = this.currentItem.time + value
    this.currentItem.time = Math.max(0, newTime)
    this.currentItem.updateElement()
    this.#updateHHMMSS()
  }

  /**
   * Update editor HH:MM:SS display and sequence estimated duration.
   */
  #updateHHMMSS() {
    const [ hh, mm, ss ] = Timer.secondsToHMS(this.currentItem.time).split(':')
    const editorHour = document.getElementById('editorHour')
    editorHour.textContent = hh
    const editorMin = document.getElementById('editorMin')
    editorMin.textContent = mm
    const editorSec = document.getElementById('editorSec')
    editorSec.textContent = ss

    Sequence.updateEstimatedTime()
  }

  #initEventListeners() {

    // load timer into editor
    addEventListener('timerSelect', (ev) => {
      this.currentItem = ev.detail.item
      this.loadTimer()
    })

    // update timer settings
    this.type.onchange = this.label.oninput = 
    () => this.#updateTimer()

    // hh mm ss wheel listener
    const editorHour = document.getElementById('editorHour')
    editorHour.addEventListener('wheel', (e) => {
      this.#incrementTimeBy(e.deltaY < 0 ? 3600 : -3600)
    })
    const editorMin = document.getElementById('editorMin')
    editorMin.addEventListener('wheel', (e) => {
      this.#incrementTimeBy(e.deltaY < 0 ? 60 : -60)
    })
    const editorSec = document.getElementById('editorSec')
    editorSec.addEventListener('wheel', (e) => {
      this.#incrementTimeBy(e.deltaY < 0 ? 1 : -1)
    })

    // display overlay and start sequence
    const startSequenceBtn = document.getElementById('startSequenceBtn')
    startSequenceBtn.onclick = () => {
      Sequence.restore()
      Overlay.toggle(true)
      Sequence.start()
    }
  }
}

