// @ts-check
import { secondsToHMSshort } from "./timeUtils.js";


/**
 * Logs timer life-cycle events.
 */
export const TimerHistory = new class {

  #historyDiv = /** @type {HTMLDivElement} */ (document.getElementById('overlayHist'));

  /** @type {number} */ #checkinTime;
  /** @type {number} */ #checkoutTime

  constructor() {
    this.#checkinTime = 0;
    this.#checkoutTime = 0;
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
   * @param {string} label Timer counter state descriptor.
   * @param {string} icon Custom icon.
   */
  checkoutTimer(label, icon) {
    const nextCheckoutTime = Date.now()
    
    // if no checkin has been made (checkinTime is -1), add deadtime
    if (this.#checkinTime === -1 && this.#checkoutTime != nextCheckoutTime) {
      this.#addDeadTime(this.#checkoutTime, nextCheckoutTime)
      this.#checkinTime = nextCheckoutTime
    }

    this.#checkoutTime = nextCheckoutTime

    const checkinHour = new Date(this.#checkinTime).toString().split(' ')[4]
    const checkoutHour = new Date(this.#checkoutTime).toString().split(' ')[4]

    const delta = ( this.#checkoutTime - this.#checkinTime ) / 1000
    const HMS = secondsToHMSshort(delta)
    const timeSession = `${checkinHour} - ${checkoutHour} (${HMS})`

    
    const timerEntry = document.createElement('p')
    timerEntry.textContent = label
    timerEntry.textContent += `\n${timeSession}`
    
    // temporary workaround till a better implementation
    timerEntry.setAttribute('icon', icon)
    this.nextIcon = ''

    this.#checkinTime = -1 // close checkin
    this.#historyDiv.append(timerEntry)
    timerEntry.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Register period of inactivity on timer history.
   * @param {number} fromDate Start Date value.
   * @param {number} toDate End Date value.
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
    deltaEntry.style.background = 'none'
    deltaEntry.style.boxShadow = 'none'
    deltaEntry.setAttribute('icon', 'deadtime')

    const duration = secondsToHMSshort(delta)

    deltaEntry.textContent = `Dead time\n${formattedFromTime} - ${formattedToTime} (${duration})`
    this.#historyDiv.append(deltaEntry)
    deltaEntry.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Clear timer logs.
   */
  clear() {
    this.#historyDiv.textContent = ''
    this.#checkinTime = 0
    this.#checkoutTime = 0
  }
}
