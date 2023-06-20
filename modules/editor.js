/**
 * Timer editor panel.
 */
const Editor = new class {

  constructor() {
    // display overlay and start sequence
    const startSequenceBtn = document.getElementById('startSequenceBtn')
    startSequenceBtn.onclick = () => {
      Sequence.restore()
      Overlay.toggle(true)
      Sequence.start()
    }
  }

}

