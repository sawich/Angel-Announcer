const config = require ('./config.js')
const axios = require ('axios')

module.exports = class CVkObserver {
  constructor(_database, _bot, _guilds, _channels) {
    this.database = _database
    this.bot      = _bot
    this.guilds   = _guilds
    this.channels = _channels

    this._group_user_lj_post = (body, msg = 'Подписочка', color = 0x00bfff) => {
      axios.get (`https://api.vk.com/method/users.get?access_token=${process.env.VK_TOKEN}&user_ids=${body.user_id}&fields=photo_50&lang=0&v=5.73`)
      .then (async (res) => {
        console.log(response)
        for (const response of res.response) {          
          await this.channels.log.send ({ embed: {
            color,
            description: `${msg} от [${response.first_name} ${response.last_name}](https://vk.com/id${response.id})`,
            author: {
              name: this.bot.user.username,
              icon_url: this.bot.user.avatarURL,
              url: config.site
            },
            thumbnail: {
              url: response.photo_50
            }
          }})
        }
      }).catch (console.log)
    }
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
    const user_data = this.database.maiden.findOne({ nick: angel_name.toLowerCase () })
    if (user_data) {
      display_user = this.guilds.main.members.get (user_data.discordid)
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

	return this.channels.announcement.send ({ embed: {
		author: {
			name: post.split ('\n')[0],
			icon_url: this.bot.user.avatarURL,
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

  async group_leave(body) {
    this._group_user_lj_post(body, 'Отписочка', 0xffff00)    
  }

  async group_join(body) {
    this._group_user_lj_post(body)
  }
}