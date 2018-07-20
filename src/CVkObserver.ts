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
    const workers = post.match (/Над главой работали:\s+(.*)\n/i)[0]
    const angel_info_regexp = /\[(id|club)(\d+)\|(.*?)\]|(#.*?)[,|\n]/gi

    let angel_info = []
    let chapter_workers = []
    while (null != (angel_info = angel_info_regexp.exec (workers))) {
      const angel_name = (angel_info[3] || angel_info[4].slice (1)).trim ()
      
      let display_user = null
      const user_data = this._database.maidens.findOne({ nick: angel_name.toLowerCase () })
      if (user_data) {
        display_user = this._guilds.main.members.get (user_data.discordid)
      }
      chapter_workers.push (display_user || angel_name)
    }

    // readers link replace to discord-like link
    const link_info_regexp = /#(\S+): (\S+)/gi

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
        name: post.split ('\n')[0],
        icon_url: this._bot.user.avatarURL,
        url: config.site
      },
      fields,
      color: 0x00bfff,
      description: `*Над главой работали: ${chapter_workers.join (', ')}*`,
      footer: {
        text: post.match (/(Переведено с .*?)[\.|\n]/i)[0],
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

  private _group_user_lj_post = (body, msg: string = 'Подписочка', color: number = 0x00bfff) => {
    axios.get (`https://api.vk.com/method/users.get?access_token=${process.env.VK_TOKEN}&user_ids=${body.user_id}&fields=photo_50&lang=0&v=5.73`)
    .then (async (res) => {
      for (const response of res.data.response) {  
                
        await this._channels.log.send ({ embed: {
          color,
          description: `${msg} от [${response.first_name} ${response.last_name}](https://vk.com/id${response.id})`,
          author: {
            name: this._bot.user.username,
            icon_url: this._bot.user.avatarURL,
            url: config.site
          },
          thumbnail: {
            url: response.photo_50
          }
        }})
      }
    }).catch (console.log)
  }

  async group_leave(body: group_leave) {
    this._group_user_lj_post(body, 'Отписочка', 0xffff00)    
  }

  async group_join(body: group_join) {
    this._group_user_lj_post(body)
  }

}