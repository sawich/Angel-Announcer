import { base } from "./base";
import { types } from "./types";

export class service {
  public async update_tp () {
    return this._base.update_tp (this._parser)
  }

  public async update_comments () {
    return this._base.update_comments (this._parser)
  }

  public async links () {
    return this._base.links (this._parser)
  }

  get translator_url () { return this._base.translator_url }
  get service () { return this._base.service }
  get icon_url () { return this._base.icon_url }
  get color () { return this._base.color }

  constructor (
    base: base.single | base.multiple,
    parser: types.ICommentsParseService
  )
  {
    this._base = base
    this._parser = parser
  }

  private _base: base.single | base.multiple
  private _parser: types.ICommentsParseService
}