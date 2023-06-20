/**
 * List of stored sequences.
 */
const SequenceList = new class {
  #storageItem = 'sequenceStorage'

  constructor() {
    this.listElement = document.getElementById('sequenceList')
    this.populate()
  }

  /**
   * Get stored sequence list object from localStorage.
   * @returns {{}} Sequence object.
   */
  getStorageObject() {
    let storageObject = JSON.parse(localStorage.getItem(this.#storageItem))
    if (!storageObject) storageObject = {}
    return storageObject
  }

  /**
   * Store sequences object in localStorage. Update list.
   * @param {{}} storageObject Object with sequences.
   */
  setStorageObject(storageObject) {
    localStorage.setItem(this.#storageItem, JSON.stringify(storageObject))
    this.populate()
  }

  /**
   * Remove stored sequence from localStorage and list.
   * @param {String} entry Stored sequence name.
   */
  removeFromList(entry) {
    let sequences = this.getStorageObject()

    if (sequences[entry]) {
      delete sequences[entry]
      this.setStorageObject(sequences)
      console.log(`deleted ${entry} from sequenceStorage`)
      return
    }

    console.log(`${entry} doesn't exist in sequenceStorage`)
  }

  /**
   * Populate list with sequences from localStorage.
   */
  populate() {
    const sequenceTitles = Object.keys( this.getStorageObject() )
    this.listElement.textContent = ''

    for (const entry of sequenceTitles) {
      const btn = document.createElement('button')
      btn.textContent = entry
      btn.style.background = '#333333'
      btn.style.borderColor = '#111111'
      btn.title = 'Load sequence. Right-click to remove'

      btn.onclick = () => this.loadSequence(entry)

      btn.oncontextmenu = () => {
        this.removeFromList(entry)
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
    let sequences = this.getStorageObject()

    const timerArray = []
    for (const timerItem of Timer.all) {
      timerArray.push({
        label: timerItem.label,
        type: timerItem.type,
        time: timerItem.time,
      })
    }

    sequences[Sequence.title] = {
      timers: timerArray,
      executions: Sequence.totalExecutions
    }

    this.setStorageObject(sequences)

    console.log(`saved timer items as ${Sequence.title}`);
  }

  /**
   * Restore all timer items from a named sequence in localStorage.
   * @param {String} loadName Stored sequence name.
   */
  loadSequence(loadName) {
    let sequences = this.getStorageObject()
    if (!sequences[loadName]) {
      return console.log(`no sequence named ${loadName} in storage.`)
    }

    // remove current items (iterate backwards to workaround re-indexing)
    for (let i = Timer.all.length - 1; i >= 0; i--) {
      const element = Timer.all[i];
      element.remove()
    }

    const { timers, executions } = sequences[loadName]
    
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

