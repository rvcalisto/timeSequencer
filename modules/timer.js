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
    const template = document.getElementById('timerItem')
    const fragment = template.content
    this.appendChild(fragment.cloneNode(true))
    this.updateElement()
    
    this.onclick = () => this.select()

    const [ addBtn, delBtn ] = this.getElementsByTagName('button')
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
  updateElement() {
    const [ label, type, time ] = this.getElementsByTagName('p')
    label.textContent = this.label
    type.textContent = this.type
    time.textContent = Timer.secondsToHMSshort(this.time)

    const img = this.getElementsByTagName('img')[0]
    img.src = `icons/clock${this.type == 'Count-Up' ? 'Up' : 'Down'}.webp`
  }

  /**
   * Select timer element and sync properties with Editor.
   */
  select() {
    const ev = new CustomEvent('timerSelect', { detail: {
      item: this
    }})
    dispatchEvent(ev)

    const elem = document.getElementsByClassName('selectedTimer')[0]
    if (elem) elem.classList.remove('selectedTimer')
    this.classList.add('selectedTimer')
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