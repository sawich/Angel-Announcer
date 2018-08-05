export class CHtmlDecoder {
  private _el: HTMLTextAreaElement
  constructor(el: HTMLTextAreaElement) {
    this._el = el
  }
  decode(html) {    
    this._el.innerHTML = html;
    return this._el.value;
  }
}