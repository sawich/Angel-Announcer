import config from './config/config.js'
import { CDataBase } from './CDataBase.js'

import { Permissions, Client, Message } from 'discord.js'

export class CMaidenManagement {

	private _database: CDataBase
	private _bot: Client

	constructor (database: CDataBase, bot: Client) {
		this._database = database
		this._bot = bot
	}

	public async delete (message: Message, nick: string) : Promise <Message | Message[]> {
		if (!nick) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD NICK\n\n${config.discord.prefix}del {team-nickname}`,
				author: {
					name: this._bot.user.username,
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		const maiden = this._database.maidens.findOne({ nick: { $regex: new RegExp(`^${nick}$`, 'i') } })
		if (!maiden) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `Юзверь не найден`,
				author: {
					name: this._bot.user.username,
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		this._database.maidens.remove(maiden)

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Юзверь удалён`,
			author: {
				name: this._bot.user.username,
				icon_url: this._bot.user.avatarURL,
				url: config.site
			},
		}})
	}

	public async list (message: Message) : Promise <Message | Message[]> {
		const angel_maidens = this._database.maidens.find()
		return message.reply ({ embed: {
			color: 0x00bfff,
			author: {
				name: this._bot.user.username,
				icon_url: this._bot.user.avatarURL,
				url: config.site
			},
			description: angel_maidens.length > 0 ? '' : '*Пусто*',
			fields: angel_maidens.map ((angel_maiden) => {
				const find = message.guild.members.get (angel_maiden.discordid)
				return { name: angel_maiden.nick, value: (find ? `*${find}*` : '*—*'), inline: true }
			})
		}})
	}

	public async add (message: Message, [ nick, discordid ]: string[]) : Promise <Message | Message[]> {
		const member = message.guild.member (discordid)
		if (!member) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `Сыча с таким(${discordid}) айдишником нет`,
				author: {
					name: this._bot.user.username,
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		if (!nick) {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: `Бэд ник(${nick})`,
				author: {
					name: this._bot.user.username,
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		try {
			this._database.maidens.insertOne({ nick, discordid })
		} catch {
			return message.reply ({ embed: {
				color: 0xff0000,
				description: 'Ошибка. Возможно юзверь уже есть в списке?',
				author: {
					name: this._bot.user.username,
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
			}})
		}

		return message.reply ({ embed: {
			color: 0x00ff00,
			description: `Готово`,
			author: {
				name: this._bot.user.username,
				icon_url: this._bot.user.avatarURL,
				url: config.site
			},
		}})
	}

}