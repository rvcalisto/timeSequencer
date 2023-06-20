/**
 * List of stored sequences.
 */
const SequenceList = new class {

  constructor() {
    this.listElement = document.getElementById('sequenceList')
    this.populate()
  }

  /**
   * Get stored sequence list object from localStorage.
   */
  getList() {
    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage) sequenceStorage = {}
    return sequenceStorage
  }

  /**
   * Remove stored sequence from localStorage and list.
   * @param {String} entry Stored sequence name.
   */
  removeFromList(entry) {
    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage || !sequenceStorage[entry]) {
      console.log(`${entry} doesn't exist in sequenceStorage`)
      return
    }

    delete sequenceStorage[entry]
    localStorage.setItem('sequenceStorage', JSON.stringify(sequenceStorage))
    console.log(`deleted ${entry} from sequenceStorage`)
  }

  /**
   * Populate list with timer elements from localStorage sequences.
   */
  populate() {
    this.listElement.textContent = ''

    for (const entry of Object.keys(this.getList())) {
      const btn = document.createElement('button')
      btn.textContent = entry
      btn.style.background = '#333333'
      btn.style.borderColor = '#111111'
      btn.title = 'Load sequence. Right-click to remove'

      btn.onclick = () => this.loadSequence(entry)

      btn.oncontextmenu = () => {
        this.removeFromList(entry)
        btn.remove()
        return false
      }

      this.listElement.appendChild(btn)
    }
  }

  /**
   * Store all timer items as a named sequence in localStorage.
   */
  storeSequence() {
    if (!Sequence.title) return

    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage) sequenceStorage = {}

    const timerArray = []
    for (const timerItem of Timer.all) {
      timerArray.push({
        label: timerItem.label,
        type: timerItem.type,
        time: timerItem.time,
      })
    }

    sequenceStorage[Sequence.title] = {
      timers: timerArray,
      executions: Sequence.totalExecutions
    }

    localStorage.setItem('sequenceStorage', JSON.stringify(sequenceStorage))
    this.populate()

    console.log(`saved timer items as ${Sequence.title}`);
  }

  /**
   * Restore all timer items from a named sequence in localStorage.
   * @param {String} loadName Stored sequence name.
   */
  loadSequence(loadName) {
    let sequenceStorage = JSON.parse(localStorage.getItem('sequenceStorage'))
    if (!sequenceStorage || !sequenceStorage[loadName]) {
      return console.log(`no items to load from ${loadName}`)
    }

    // remove current items (iterate backwards to workaround re-indexing)
    for (let i = Timer.all.length - 1; i >= 0; i--) {
      const element = Timer.all[i];
      element.remove()
    }

    const { timers, executions } = sequenceStorage[loadName]
    
    // restore sequence properties and timers
    Sequence.title = loadName
    Sequence.totalExecutions = executions

    for (const timer of timers) {
      const { label, type, time } = timer

      const newTimer = document.createElement('timer-item')
      newTimer.label = label
      newTimer.type = type
      newTimer.time = Number(time)

      document.getElementById('sequencer').appendChild(newTimer)
    }

    // select last
    Timer.all[Timer.all.length - 1].select()
    console.log(`loaded timer items from ${loadName}`)
  }
}

