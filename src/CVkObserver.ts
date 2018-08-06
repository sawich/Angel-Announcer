import config from './config/config.js'
import { CDataBase } from './CDataBase'
import { CChannels } from './CChannels'
import { CGuilds } from './CGuilds'

import { Client } from 'discord.js'
import axios from 'axios'

export type group_leave = {
  type: string
  object: {
    user_id: number,
    self: number
  }
  group_id: number
}

export type group_join = {
  type: string
  object: {
    user_id: number,
    join_type: string
  }
  group_id: number
}

interface vk_user_get_t {
  id: number
  first_name: string
  last_name: string
  deactivated?: string
}

interface vk_user_get_group_user_t extends vk_user_get_t {
  photo_50: string
}

export class CVkObserver {
  
  _database: CDataBase
  _bot: Client
  _guilds: CGuilds
  _channels: CChannels

  constructor(database, bot, guilds, channels) {
    this._database = database
    this._bot      = bot
    this._guilds   = guilds
    this._channels = channels
  }

  async manga_post(post) {
    if (!post.includes (config.vk.tag)) { return }

    // users link replace to discord users
    const angelmaidens = post.match (/Над главой работали:(?:\s+|)(.*)(?:\n|$)/i)[1] || ''
    const angelmaiden_name = /[\||#](.*?)(?:,|\]|$|\n)/gi

    let angel_info = []
    let chapter_workers = []
    while (null != (angel_info = angelmaiden_name.exec (angelmaidens))) {
      let display_user = null
      const angelmaiden = await this._database.maidens.findOne({ nick: angel_info[1] })
      if (angelmaiden) {
        display_user = this._guilds.main.members.get (angelmaiden['discord_id'])
      }

      chapter_workers.push (display_user || angel_info[1])
    }

    // readers link replace to discord-like link
    const link_info_regexp = /#(\S+):.*?(http\S+)/gi

    let link_info = null
    let fields = []
    while (null != (link_info = link_info_regexp.exec (post))) {
      fields.push ({
        name: `${link_info[1]}`,
        value: `[тык](${link_info[2]})`,
        inline: true
      })
    }

    return this._channels.announcement.send ({ embed: {
      author: {
        name: post.split ('\n', 1)[0],
        icon_url: this._bot.user.avatarURL,
        url: config.site
      },
      fields,
      color: 0x00bfff,
      description: `*Над главой работали: ${chapter_workers.join (', ')}*`,
      footer: {
        text: post.match (/Переведено с .*?(?:\.|\n|$)/i)[0] || 'Язык перевода не указан',
        icon_url: config.team_icon_url
      }
    }})
  }

  async confirmation(res, body) {
    res.send (process.env.VK_CON)

    this._channels.log.send ({ embed: {
      color: 0xffff00,
      description: `VK confirmation request [clubid:${body.group_id}]`,
      author: {
        name: this._bot.user.username,
        icon_url: this._bot.user.avatarURL,
        url: config.site
      },
    }})
  }

  private async _group_user_lj_post(body, msg: string = 'Подписочка', color: number = 0x00bfff) {
    
    const response_raw = (await axios.get (`https://api.vk.com/method/users.get?access_token=${process.env.VK_TOKEN}&user_ids=${body.object.user_id}&fields=photo_50&lang=0&v=5.73`)).data
    if(response_raw['error']) {
      throw response_raw
    }

    for(const data of response_raw['response'] as Array <vk_user_get_group_user_t>) {
      this._channels.log.send ({ embed: {
        color,
        description: `${msg} от [${data.first_name} ${data.last_name}](https://vk.com/id${data.id})`,
        author: {
          name: this._bot.user.username,
          icon_url: this._bot.user.avatarURL,
          url: config.site
        },
        thumbnail: {
          url: data.photo_50
        },
        timestamp: new Date
      }})
    }
  }

  async group_leave(body: group_leave) {
    this._group_user_lj_post(body, 'Отписочка', 0xffff00)    
  }

  async group_join(body: group_join) {
    this._group_user_lj_post(body)
  }

}