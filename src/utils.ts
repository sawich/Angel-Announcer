import config from './config/config'
import { CChannels } from './CChannels'
import { CGuilds } from './CGuilds'
import { Client, Message } from 'discord.js'

// hash string to 32-bit ibnteger
function hash_code (str: string) {
  let hash: number = 0
  let chr: number;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

export const utils = {
  hash_code
}

export interface IOnError {
  (error: Error): Promise <Message | Message[]>
}

export class error {
  protected async onError (error: Error, fields = []) {
    return this._channels.log.send ({ embed: {
      color: 0xFF0000,
      title: error.name,
      description: error.message,
      author: {
        name: this._guilds.main.member(this._discord_client.user.id).displayName,
        icon_url: this._discord_client.user.avatarURL,
        url: config.site
      },
      fields: [{
        name: 'stack trace',
        value: `\`\`\`ps\n${error.stack}\`\`\``
      }, ...fields ],
      timestamp: new Date
    }}).catch (this.onError.bind (this))
  }

  constructor (
    discord_client: Client,
    guilds: CGuilds,
    channels: CChannels)
  {    
    this._discord_client = discord_client
    this._guilds = guilds
    this._channels = channels
  }
  
  protected _discord_client: Client
  protected _guilds: CGuilds
  protected _channels: CChannels
}