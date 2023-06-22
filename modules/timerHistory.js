/**
 * Logs timer life-cycle events.
 */
const TimerHistory = new class {
  #historyDiv; #checkinTime; #checkoutTime

  constructor() {
    this.#historyDiv = document.getElementById('overlayHist')
    this.#checkinTime = 0
    this.#checkoutTime = 0
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

    let delta = ( this.#checkoutTime - this.#checkinTime ) / 1000
    delta = Timer.secondsToHMSshort(delta)
    const timeSession = `${checkinHour} - ${checkoutHour} (${delta})`

    
    const timerEntry = document.createElement('p')
    timerEntry.classList = 'overlayHistItem'
    timerEntry.textContent = label
    timerEntry.textContent += `\n${timeSession}`
    
    // temporary workaround till a better implementation
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

  /**
   * Clear timer logs.
   */
  clear() {
    this.#historyDiv.textContent = ''
    this.#checkinTime = 0
    this.#checkoutTime = 0
  }
}