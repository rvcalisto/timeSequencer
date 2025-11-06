// @ts-check


/**
 * Input custom element for numeric values.
 */
export class NumericInput extends HTMLElement {

  /**
   * @type {HTMLInputElement}
   */
  #inputElement;

  /**
   * Current value.
   */
  #value = 0;

  /**
   * Minimum allowed value.
   */
  min = 0;

  /**
   * Maximum allowed value.
   */
  max = 99;

  /**
   * On value change callback.
   * @type {Function}
   */
  onValueChange = () => {};

  static {
    customElements.define('numeric-input', NumericInput);
  }

  set value(newValue) {
    this.#value = this.#clamp(newValue);

    if (this.isConnected)
      this.#inputElement.value = `${this.#value}`.padStart(2, '0');

    this.onValueChange();
  }

  get value() {
    return this.#value;
  }

  /**
   * Clamp number to range.
   * @param {number} value
   */
  #clamp(value) {
    return Math.min( this.max, Math.max(this.min, value) );
  }

  connectedCallback() {
    this.#inputElement = document.createElement('input');
    this.#inputElement.type = 'number';
    this.#inputElement.style.fontSize = 'inherit';
    this.#inputElement.style.textAlign = 'inherit';
    this.#inputElement.style.background = 'inherit';
    this.#inputElement.style.width = 'inherit';
    this.#inputElement.style.border = 'none';
    this.append(this.#inputElement);

    this.value = this.#clamp( Number(this.value) );

    // temporarily clear input on focus
    this.#inputElement.addEventListener('focus', () => {
      this.#inputElement.placeholder = this.#inputElement.value;
      this.#inputElement.value = '';
    });

    // evaluate input value on loss of focus
    this.#inputElement.addEventListener('blur', () => {
      const value = Number(this.#inputElement.value);

      if ( this.#inputElement.value === '' || isNaN(value) )
        this.value = this.#value;
      else
        this.value = value;
    });

    // force loss of focus on confirm
    this.#inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')
        this.#inputElement.blur();
    });

    // force loss of focus on input limit
    this.#inputElement.addEventListener('input', () => {
      if (this.#inputElement.value.length > 1)
        this.#inputElement.blur();
    });

    // change sequence execution count
    this.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.value += Math.sign(-e.deltaY);
    }, { passive: false });
  }
}
