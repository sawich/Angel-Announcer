import * as srv_comments from '../comments'
import { Client } from 'discord.js'
import { CChannels } from '../CChannels'
import { CGuilds } from '../CGuilds'
import config from '../config/config'
import { error } from '../utils';

export class comments extends error {
	private async _interval (callback: () => Promise <void>, intr: number) {
    try {
      await callback ()
    } catch (error) {
      await this.onError (error)
    }
    
    return setTimeout (this._interval.bind(this, callback.bind (this), intr), intr)
  }

	constructor(
    services: srv_comments.service[],
    discord_client: Client,
    channels: CChannels,
    guilds: CGuilds)
  {
    super (discord_client, guilds, channels)

    const launch = async () => {
      for (const s of services) {
        await this._interval(s.update_tp.bind(s), config.comments.time.translator)
        this._interval(s.update_comments.bind(s), config.comments.time.comments)
      }
    }

    launch ()
  }
}