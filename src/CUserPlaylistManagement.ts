import { CUserPlaylist } from './CUserPlaylist'

import { Message } from 'discord.js'

export class CUserPlaylistManagement {

  private _items: Map <string, CUserPlaylist>

  constructor() {}

  async get(message: Message): Promise <CUserPlaylist> {
    let playlist: CUserPlaylist = this._items.get(message.member.id)

    if (!playlist) {
      playlist = new CUserPlaylist(message.member)
      this._items.set(message.member.id, playlist)
    }

    return playlist
  }

}