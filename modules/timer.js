/**
 * Tag element to visualize and configure timer sequence prior to executing it.
 */
class Timer extends HTMLElement {

  static nextIdx = 0
  #timeout

  constructor(type = 'Count-Down', time = 5, label = `Timer #${++Timer.nextIdx}`) {
    super()

    /**
     * @type {'Count-Up'|'Count-Down'}
     */
    this.type = type
    this.label = label
    this.time = time

    this.currentTime = time
    this.running = false

    this.consumedTime = 0
    this.#timeout
  }

  connectedCallback() {
    const template = document.getElementById('timerTemplate')
    const fragment = template.content

    this.attachShadow({ mode: "open" })
    this.shadowRoot.appendChild(fragment.cloneNode(true))

    this.#updateElement()
    this.#updateEditor()
    this.#initInputs()
  }

  /**
   * Initialize input event listeners.
   */
  #initInputs() {
    this.onclick = () => this.select()

    const [ addBtn, delBtn ] = this.shadowRoot.getElementById('spawnButtons').children
    addBtn.onclick = (e) => {
      e.stopPropagation()
      const timerItem = document.createElement('timer-item')
      this.after(timerItem)
      timerItem.select()
    }

    delBtn.onclick = (e) => {
      e.stopPropagation()
      this.removeItem()
    }

    const inputType = this.shadowRoot.getElementById('editorType')
    inputType.onchange = () => {
      this.type = inputType.value

      // set time to zero if counting up, 5s otherwise
      if (this.type == 'Count-Up') this.time = 0 
      else if (this.time == 0) this.time = 5
      this.#updateEditor()

      this.#updateElement()
    }

    const labelInput = this.shadowRoot.getElementById('editorLabel')
    labelInput.oninput = () => {
      this.label = labelInput.value
      this.#updateElement()
    }


    const updateTimeByValue = (value) => {
      const newTime = this.time + value

      // clamp time based on type
      if (this.type == 'Count-Up') this.time = Math.max(0, 0)
      else this.time = Math.max(1, newTime)

      this.#updateElement()
      this.#updateEditor()
    }


    const editorHour = this.shadowRoot.getElementById('editorHour')
    editorHour.addEventListener('wheel', (e) => {
      updateTimeByValue(e.deltaY < 0 ? 3600 : -3600)
    })

    const editorMin = this.shadowRoot.getElementById('editorMin')
    editorMin.addEventListener('wheel', (e) => {
      updateTimeByValue(e.deltaY < 0 ? 60 : -60)
    })

    const editorSec = this.shadowRoot.getElementById('editorSec')
    editorSec.addEventListener('wheel', (e) => {
      updateTimeByValue(e.deltaY < 0 ? 1 : -1)
    })
  }

  /**
   * Update editor inputs with current timer data.
   */
  #updateEditor() {
    const typeInput = this.shadowRoot.getElementById('editorType')
    const labelInput = this.shadowRoot.getElementById('editorLabel')

    typeInput.value = this.type
    labelInput.value = this.label


    const [ hh, mm, ss ] = Timer.secondsToHMS(this.time).split(':')
    const editorHour = this.shadowRoot.getElementById('editorHour')
    editorHour.textContent = hh
    const editorMin = this.shadowRoot.getElementById('editorMin')
    editorMin.textContent = mm
    const editorSec = this.shadowRoot.getElementById('editorSec')
    editorSec.textContent = ss

    Sequence.updateEstimatedTime()
  }

  /** 
   * Start timer ticks. 
   */
  start() {
    this.running = true

    this.#timeout = setInterval(() => {

      // end of countdown
      if (this.type == 'Count-Down' && this.currentTime <= 0) {
        this.onfinish()
        return
      }

      // tick
      Sequence.consumedTime += 1
      this.consumedTime += 1
      this.currentTime += this.type == 'Count-Up' ? 1 : -1

      this.#signal()
    }, 1000);

    this.#signal('timerStart')
  }

  /** 
   * Stops timer and emits a `timerFinished` event. 
   */
  onfinish() {
    this.stop()
    console.log(`[${this.label}] timerFinished`);
    const ev = new CustomEvent('timerFinished', { detail: {
      label: this.label,
      time: this.time,
      consumedTime: this.consumedTime
    } })
    dispatchEvent(ev)
  }

  /** 
   * Pause timer 
   */
  stop() {
    this.running = false
    clearInterval(this.#timeout)
  }

  /** 
   * Restore timer state. 
   */
  restore() {
    this.consumedTime = 0
    this.currentTime = this.time
  }

  #signal(signal = 'timerTick') {
    const ev = new CustomEvent(signal, {detail : {
      currentTime: this.currentTime,
      label: this.label,
      type: this.type
    }})
    dispatchEvent(ev)
    console.log(`[${this.label}] currentTime: ${this.currentTime}`);
  }

  /**
   * Update label elements to reflect property values.
   */
  #updateElement() {
    const timerInfo = this.shadowRoot.getElementById('timerInfo')
    const [ label, type, time ] = timerInfo.children
    label.textContent = this.label
    type.textContent = this.type
    time.textContent = Timer.secondsToHMSshort(this.time)

    const icon = this.type == 'Count-Up' ? 'clockUp' : 'clockDown'
    timerInfo.style.backgroundImage = `url(icons/${icon}.webp)`
  }

  /**
   * Select timer element and sync properties with Editor.
   */
  select() {
    // hide previous selected timer inputBox
    const elem = document.getElementsByClassName('selectedTimer')[0]
    if (elem) {
      elem.classList.remove('selectedTimer')
      elem.shadowRoot.getElementById('timerInputBox').style.width = '0'
    }
    
    // and show ours ;)
    this.classList.add('selectedTimer')
    this.shadowRoot.getElementById('timerInputBox').style.width = ''
  }

  /**
   * Remove timer element from DOM and select adjacent neighbor if any.
   */
  removeItem() {
    if (Timer.all.length < 2) return
    let nextItem = this.nextSibling ? this.nextSibling : this.previousSibling
    this.remove()
    nextItem.select()
  }

  /**
   * Add new timer as neighbor.
   */
  static newItem() {
    const timerItem = document.createElement('timer-item')
    document.getElementById('sequencer').appendChild(timerItem)
    timerItem.select()
  }

  /**
   * Return all timer elements in order.
   * @returns {Timer[]}
   */
  static get all() {
    return [...document.getElementsByTagName('timer-item')]
  }

  /**
   * Convert seconds to "HH:MM:SS".
   * @param {Number} seconds Seconds to convert.
   * @returns {String}
   */
  static secondsToHMS(seconds) {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor(seconds % 3600 / 60)
    let s = Math.floor(seconds % 3600 % 60)

    h = h ? String(h).padStart(2,0) : '00'
    m = m ? String(m).padStart(2,0) : '00'
    s = s ? String(s).padStart(2,0) : '00'

    return `${h}:${m}:${s}`
  }

  /**
   * Convert seconds to "0h 0m 0s".
   * @param {Number} seconds Seconds to convert.
   * @returns {String}
   */
  static secondsToHMSshort(seconds) {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor(seconds % 3600 / 60)
    let s = Math.floor(seconds % 3600 % 60)

    h = h ? `${String(h).padStart(1,0)}h ` : ''
    m = m ? `${String(m).padStart(1,0)}m ` : ''
    s = s ? `${String(s).padStart(1,0)}s` : ''

    return `${h}${m}${s}`
  }

}


customElements.define('timer-item', Timer)