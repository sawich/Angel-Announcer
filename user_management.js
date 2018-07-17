const discord = require('discord.js')

module.exports = class user_management {
  constructor (_maiden, _bot, _config, _guild) {
    this.db = {
      maiden: _maiden
    }

    this.bot = _bot
    this.config = _config
    this.guild = _guild
  }

  async delete (message, nick) {
    if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD NICK\n\n${this.config.discord.prefix}del {team-nickname}`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: this.config.site
				},
			}})
		}

		const maiden = this.db.maiden.findOne({ nick: { $regex: new RegExp(`^${nick}$`, 'i') } })
		if (!maiden) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `Юзверь не найден`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: this.config.site
				},
			}})
		}

		this.db.maiden.remove(maiden)

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Юзверь удалён`,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: this.config.site
			},
		}})
  }

  async list (message) {
		if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		const angel_maidens = this.db.maiden.find()
		message.reply ({ embed: {
			color: 0x00bfff,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: this.config.site
			},
			description: angel_maidens.length > 0 ? '' : '*Пусто*',
			fields: angel_maidens.map ((angel_maiden) => {
				const find = this.guild.members.get (angel_maiden.discordid)
				return { name: angel_maiden.nick, value: `${find}` || 'Юзверь не найден на сервере', inline: true }
			})
		}})
  }

  async add (message, [nick, discordid]) {
    if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick || !discordid) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD id or NICK\n\n${this.config.discord.prefix}add {team-nickname} {discordid}`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: this.config.site
				},
			}})
		}

		const member = this.guild.member (discordid)
		if (!member) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `member [id:${discordid}] not found`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: this.config.site
				},
			}})
		}

		try {
			this.db.maiden.insert({ nick, discordid })
		} catch {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: 'Ошибка. Возможно юзверь уже есть в списке?',
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: this.config.site
				},
			}})
		}

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Successful`,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: this.config.site
			},
		}})
  }
}