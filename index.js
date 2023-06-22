/**
 * Creates a notification request button when permission isn't already detected.
 */
function createNotificationButton() {
  if (Notification.permission === 'granted') return

  const allowNotifyBtn = document.createElement('button')
  allowNotifyBtn.textContent = '🔔❔'
  allowNotifyBtn.className = 'mediumBtn'
  allowNotifyBtn.style.background = 'mediumslateblue'
  allowNotifyBtn.style.borderColor = 'darkslateblue'
  allowNotifyBtn.title = 'Allow notifications for timeout alerts while this tab is unfocused?'

  allowNotifyBtn.onclick = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') allowNotifyBtn.remove()
  }

  const estimatedTimeLabel = document.getElementById('executeFrame')
  estimatedTimeLabel.before(allowNotifyBtn)
}


onload = function startApp() {
  Timer.newItem()
  createNotificationButton() 
}

