const discord = require('discord.js')
const config = require ('./config.js')

module.exports = class CUserManagement {
  constructor (_database, _bot) {
    this.database = _database
    this.bot = _bot
  }

  async delete (message, nick) {
    if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD NICK\n\n${config.discord.prefix}del {team-nickname}`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		const maiden = this.database.maidens.findOne({ nick: { $regex: new RegExp(`^${nick}$`, 'i') } })
		if (!maiden) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `Юзверь не найден`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		this.database.maidens.remove(maiden)

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Юзверь удалён`,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: config.site
			},
		}})
  }

  async list (message) {
		if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		const angel_maidens = this.database.maidens.find()
		message.reply ({ embed: {
			color: 0x00bfff,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: config.site
			},
			description: angel_maidens.length > 0 ? '' : '*Пусто*',
			fields: angel_maidens.map ((angel_maiden) => {
				const find = message.guild.members.get (angel_maiden.discordid)
				return { name: angel_maiden.nick, value: `${find}` || 'Юзверь не найден на сервере', inline: true }
			})
		}})
  }

  async add (message, [nick, discordid]) {
    if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick || !discordid) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD id or NICK\n\n${config.discord.prefix}add {team-nickname} {discordid}`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		const member = message.guild.member (discordid)
		if (!member) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `member [id:${discordid}] not found`,
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		try {
			this.database.maidens.insert({ nick, discordid })
		} catch {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: 'Ошибка. Возможно юзверь уже есть в списке?',
				author: {
					name: this.bot.user.username,
					icon_url: this.bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Successful`,
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL,
				url: config.site
			},
		}})
  }
}