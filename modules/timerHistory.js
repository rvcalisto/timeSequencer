// @ts-check
import { secondsToHMSshort } from "./timeUtils.js";


const containerElement = /** @type {HTMLDivElement} */ (document.getElementById('overlayHist'));
let checkInTime = 0;
let checkOutTime = 0;


/**
 * Register timer-start on timer history.
 */
export function checkInTimerHistory() {
  checkInTime = Date.now();

  // add deadtime if space between checkin and last checkout
  if (containerElement.lastChild && checkInTime != checkOutTime)
    addDeadTime(checkOutTime, checkInTime);
}

/**
 * Register timer-end on timer history.
 * @param {string} label Timer counter state descriptor.
 * @param {string} icon Custom icon.
 */
export function checkOutTimerHistory(label, icon) {
  const nextCheckoutTime = Date.now();

  // if no checkin has been made (checkinTime is -1), add deadtime
  if (checkInTime === -1 && checkOutTime != nextCheckoutTime) {
    addDeadTime(checkOutTime, nextCheckoutTime);
    checkInTime = nextCheckoutTime;
  }

  checkOutTime = nextCheckoutTime;

  const checkinHMS = new Date(checkInTime).toString().split(' ')[4];
  const checkoutHMS = new Date(checkOutTime).toString().split(' ')[4];

  const delta = (checkOutTime - checkInTime) / 1000;
  const HMS = secondsToHMSshort(delta);
  const timeSession = `${checkinHMS} - ${checkoutHMS} (${HMS})`;

  // log element and close check-in
  addElement(`${label}\n${timeSession}`, icon);
  checkInTime = -1;
}

/**
 * Clear timer logs.
 */
export function clearTimerHistory() {
  containerElement.textContent = '';
  checkInTime = 0;
  checkOutTime = 0;
}

/**
 * Log new entry to history.
 * @param {string} text Entry text content.
 * @param {string} icon Entry icon.
 */
function addElement(text, icon) {
  const element = document.createElement('p');
  element.setAttribute('icon', icon);
  element.textContent = text;
  
  containerElement.append(element);
  element.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Register period of inactivity on timer history.
 * @param {number} fromDate Start Date value.
 * @param {number} toDate End Date value.
 */
function addDeadTime(fromDate, toDate) {
  if (containerElement.lastElementChild == null)
    return;

  const fromHMS = new Date(fromDate).toString().split(' ')[4];
  const toHMS = new Date(toDate).toString().split(' ')[4];

  if (fromHMS !== toHMS) {
    const delta = (toDate - fromDate) / 1000;
    const duration = secondsToHMSshort(delta);

    const text = `Dead time\n${fromHMS} - ${toHMS} (${duration})`;
    addElement(text, 'deadtime');
  }
}
