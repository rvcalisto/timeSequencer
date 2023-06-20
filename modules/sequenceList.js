/**
 * List of stored sequences.
 */
const SequenceList = new class {

  constructor() {
    this.listElement = document.getElementById('sequenceList')
    this.populate()
    
    const sequenceSaveBtn = document.getElementById('sequenceSave')
    sequenceSaveBtn.onclick = () => {
      Sequence.storeSequence()
      this.populate()
    }
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
      btn.className = 'greenBtn'
      btn.style.background = '#333333'
      btn.style.borderColor = '#111111'

      btn.onclick = () => Sequence.loadSequence(entry)

      btn.oncontextmenu = () => {
        this.removeFromList(entry)
        btn.remove()
        return false
      }

      this.listElement.appendChild(btn)
    }
  }
}

