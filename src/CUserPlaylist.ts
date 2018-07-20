import { GuildMember } from 'discord.js'

export class CUserPlaylist {

  private _owner: GuildMember

  constructor(owner: GuildMember) {
    this._owner = owner
  }

  async add (): Promise <void> {}
  
  async delete ():  Promise <void> {}
  
  async list ():  Promise <void> {}
  
  async clear ():  Promise <void> {}

}