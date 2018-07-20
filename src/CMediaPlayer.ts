import config from './config/config'
import { CChannels } from './CChannels'
import { CGuilds } from './CGuilds'

import * as ytdl from 'ytdl-core'
import {
  Client,
  Message,
  VoiceChannel,
  StreamDispatcher,
  VoiceBroadcast,
  VoiceConnection
} from 'discord.js'

export interface IMediaPlayerPlaylistItem {
  play(): Promise <void>
}

class CMediaPlayerPlaylistItemYouTube implements IMediaPlayerPlaylistItem {

  async play(): Promise <void> {}

}

export class CMediaPlayerPlaylist {

  private _items: Array <IMediaPlayerPlaylistItem>

  constructor() {}

  async add(_item:Array <IMediaPlayerPlaylistItem>) {}

  async remove(_id: number): Promise <void> {}


}

export class CMediaPlayerPlayistInfo {

  private _current: number


}

export class CMediaPlayer {

  private _discord_client: Client
  private _channels: CChannels
  private _guilds: CGuilds

  private _playlist: CMediaPlayerPlaylist

  constructor(discord_client: Client, channels: CChannels, guilds: CGuilds) {
    this._discord_client = discord_client
    this._channels = channels
    this._guilds = guilds

    this._playlist = new CMediaPlayerPlaylist()
  }

  async play() {}

  async pause() {}

  async stop() {}

  async skip() {}

  async clear() {}

  async join(message: Message): Promise <void> {
    const v_channel: VoiceChannel = message.member.voiceChannel
    if(undefined === v_channel || !v_channel.joinable) { return }

    let connection: VoiceConnection
    try {
      connection = await v_channel.join()
    } catch (ex) {
      this._channels.log.send({ embed: {
        color: 0xff0000,
        description: `${ex}`,
        author: {
          name: this._discord_client.user.username,
          icon_url: this._discord_client.user.avatarURL,
          url: config.site
        },
      }})
      console.trace(ex)
      return
    }

    const ytdl_stream = ytdl('https://www.youtube.com/watch?v=2EUAF0-KlDY', {
      filter: 'audioonly',
      quality: 'highest'
    })

    connection.playStream(ytdl_stream, {
      passes: 2,
      seek: 0
    })
  }

  async leave() {
    const v_connection = this._guilds.main.voiceConnection
    if(undefined === v_connection) { return }

    v_connection.channel.leave()
  }

  get playlist() { return this._playlist }
  set playlist(_value: CMediaPlayerPlaylist) {}

  get volume() { return 0 }
  set volume(_value) {}

}