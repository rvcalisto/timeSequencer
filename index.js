// @ts-check
import { Sequence } from "./modules/sequence.js";


/**
 * Creates a notification request button when permission isn't already detected.
 */
function createNotificationButton() {
  const button = document.createElement('button');
  button.textContent = '🔔';
  button.style.background = 'mediumslateblue';
  button.style.borderColor = 'darkslateblue';
  button.title = 'Allow notifications for timeout alerts while this tab is unfocused?';

  button.onclick = async () => {
    const permission = await Notification.requestPermission();
    permission !== 'default' && button.remove();
  }

  document.querySelector('header')?.append(button);
}

addEventListener('load', function startApp() {
  Sequence.addTimer();

  if (Notification.permission === 'default')
    createNotificationButton();
});
