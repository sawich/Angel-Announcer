import config from './config/config.js'
import { CDataBase } from './CDataBase.js'
import { CGuilds } from './CGuilds.js'

import { Client, Message, GuildMember, Permissions } from 'discord.js'
import { CChannels } from './CChannels.js';

export class CMaidenManagement {
	private _database: CDataBase
	private _bot: Client

	constructor(database: CDataBase, bot: Client, guilds: CGuilds, channels: CChannels) {
		this._database = database
		this._bot = bot

		// добавление англодев, которые получили крылья, пока бот спал	
		const new_maidens = [ 
			...guilds.main.roles.get(config.roles.angel_maiden).members.filterArray((member) => !this._database.maidens.findOne({ discordid: member.id })),
			...guilds.main.roles.get(config.roles.angel_maiden_half).members.filterArray((member) => !this._database.maidens.findOne({ discordid: member.id }))
		]
		
		if(new_maidens.length > 0) {
			this._database.maidens.insert(new_maidens.map((member) => ({
				nick: member.id,
				discordid: member.id
			})))

			channels.log.send({ embed: {
				color: 0x00bfff,
				author: {
					name: 'Новые англодевы',
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
				fields: new_maidens.map((maiden) => ({ name: maiden.id, value: `${maiden}`, inline: true }))
			}})
		}
	
		// удаление англодев, которые утратили крылья, пока бот спал	
		const ex_angel_maiden = this._database.maidens.chain().data().reduce((array, angel_maiden) => {
			const member = guilds.main.members.get(angel_maiden.discordid)
			const result = !member || (!(!member.roles.has(config.roles.angel_maiden) && !member.roles.has(config.roles.angel_maiden_half)))

			if(!result) {
				this._database.maidens.remove(angel_maiden)

				array.push({
					name: angel_maiden.nick,
					value: `${member}` || '*Англодева покинула сервер*',
					inline: true
				})
			}

			return array
		}, [])
		
		if(ex_angel_maiden.length > 0) {
			channels.log.send({ embed: {
				color: 0x00bfff,
				author: {
					name: 'Бывшие англодевы',
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
				fields: ex_angel_maiden
			}})
		}

		this._bot.on('guildMemberUpdate', async (
			old_user: GuildMember, 
			new_user: GuildMember
		) => {
			// добро пожаловать
			if((!old_user.roles.has(config.roles.angel_maiden) && !old_user.roles.has(config.roles.angel_maiden_half)) &&
				(new_user.roles.has(config.roles.angel_maiden) || new_user.roles.has(config.roles.angel_maiden_half))
			) {
				const maiden = this._database.maidens.insertOne({
					nick: new_user.id,
					discordid: new_user.id
				})

				if(!maiden) {
					channels.log.send({ embed: {
						color: 0xff0000,
						description: 'Ошибка добавления записи',
						author: {
							name: 'Новая англодева',
							icon_url: this._bot.user.avatarURL,
							url: config.site
						},
					}})
					return
				}

				channels.log.send({ embed: {
					color: 0x00bfff,
					author: {
						name: 'Новая англодева',
						icon_url: this._bot.user.avatarURL,
						url: config.site
					},
					fields: [{
						name: new_user.id,
						value: `${new_user}`
					}]
				}})
				return
			}

			// иди погуляй
			if((old_user.roles.has(config.roles.angel_maiden) || old_user.roles.has(config.roles.angel_maiden_half)) &&
				(!new_user.roles.has(config.roles.angel_maiden) && !new_user.roles.has(config.roles.angel_maiden_half))
			) {
				const maiden = this._database.maidens.findOne({
					discordid: new_user.id
				})

				if(!maiden) {
					channels.log.send({ embed: {
						color: 0xff0000,
						description: 'Ошибка удаления записи Ничего не найдено',
						author: {
							name: 'Бывшая англодева',
							icon_url: this._bot.user.avatarURL,
							url: config.site
						},
					}})
					return
				}

				channels.log.send({ embed: {
					color: 0x00bfff,
					author: {
						name: 'Бывшая англодева',
						icon_url: this._bot.user.avatarURL,
						url: config.site
					},
					fields: [{
						name: maiden.nick,
						value: `${new_user}`
					}]
				}})

				this._database.maidens.remove(maiden)
			}
		})
	}

	async edit(message: Message, discordid: string, nick: string) {
		if (!message.member.hasPermission (Permissions.FLAGS.ADMINISTRATOR)) { return }
		
	}

	async set(message: Message, new_nick: string) {
		const angel_maiden = this._database.maidens.findOne({ discordid: message.member.id })
		if(null === angel_maiden) { return }
		if(undefined === new_nick) {
			throw "Введи новый ник"
		}

		angel_maiden.nick = new_nick
		this._database.maidens.update(angel_maiden)
	}

	/**
	 * @param {Message} message discord message
	 * @param {number} page number of page to output
	 * @param {number} limit count of fields to output. 25 - default discord fields limit
	 */
	public async list(message: Message, page: number, limit: number = 25) {
		if (!message.member.hasPermission (Permissions.FLAGS.ADMINISTRATOR)) { return }
		
		const maidens = this._database.maidens.count()

		const offset = (--page) * limit
		const angel_maidens = this._database.maidens.chain().find().offset((offset >= maidens || offset < 0) ? (page = 0) : offset).limit(limit).data()
		
		message.reply({ embed: {
			color: 0x00bfff,
			footer: {
				text: angel_maidens.length > 0 ? `Страница ${page + 1} из ${Math.ceil(maidens / limit) }` : '',
			},
			author: {
				name: 'Англодевы',
				icon_url: this._bot.user.avatarURL,
				url: config.site
			},
			description: angel_maidens.length > 0 ? '' : '*Пусто*',
			fields: angel_maidens.map((angel_maiden) => {
				const find = message.guild.members.get(angel_maiden.discordid)
				return { name: angel_maiden.nick, value:(find ? `*${find}*` : '*—*'), inline: true }
			})
		}})
	}
}