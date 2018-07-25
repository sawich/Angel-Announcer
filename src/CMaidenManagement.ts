import config from './config/config.js'
import { CDataBase } from './CDataBase.js'
import { CGuilds } from './CGuilds.js'

import { Client, Message, GuildMember, Permissions } from 'discord.js'
import { CChannels } from './CChannels.js';
import { Model, Document, Types } from 'mongoose';

export type CMaidenManagementList = {
	page: number,
	total: number,
	list: Array <Document>
} 

export class CMaidenManagement {
	private _maidens: Model <Document>
	private _bot: Client
	private _guilds: CGuilds
	private _channels: CChannels

	async init() {
		const docs = await this._maidens.find({})

		const angelmaidens = [
			...Array.from(this._guilds.main.roles.get(config.roles.angel_maiden).members.values()),
			...Array.from(this._guilds.main.roles.get(config.roles.angel_maiden_half).members.values())
		]

		// добавление англодев, которые получили крылья, пока бот спал
		const new_angelmaidens = angelmaidens.filter((angelmaiden) => {
			if(undefined !== docs.find((value) => value['id'] == angelmaiden.id)) {
				return false;
			}

			this._maidens.create({
				id: angelmaiden.id,
				nick: angelmaiden.id
			})

			return true
		})

		if(new_angelmaidens.length > 0) {
			this._channels.log.send({ embed: {
				color: 0x00bfff,
				description: new_angelmaidens.length > 25 ? `25 из ${new_angelmaidens.length}` : '',
				author: {
					name: 'Новые англодевы',
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
				fields: new_angelmaidens.slice(0, 25).map((maiden) => ({ name: maiden.id, value: `${maiden}`, inline: true }))
			}})
		}

		// удаление англодев, которые утратили крылья, пока бот спал
		const roles = [ config.roles.angel_maiden, config.roles.angel_maiden_half ]

		const ex_angelmaidens = docs.reduce((array, angel_maiden) => {
			const member = this._guilds.main.members.get(angel_maiden['id'])
			if(!member || !member.roles.some((role) => roles.includes(role.id))) {
				angel_maiden.remove()
				array.push({
					name: angel_maiden['nick'],
					value: `${member || '*Англодева покинула сервер*'}`,
					inline: true
				})
			}

			return array
		}, [])
		

		if(ex_angelmaidens.length > 0) {
			this._channels.log.send({ embed: {
				color: 0x00bfff,
				description: ex_angelmaidens.length > 25 ? `25 из ${ex_angelmaidens.length}` : '',
				author: {
					name: 'Бывшие англодевы',
					icon_url: this._bot.user.avatarURL,
					url: config.site
				},
				fields: ex_angelmaidens.slice(0, 25)
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
				try {
					await this._maidens.create({
						nick: new_user.id,
						id: new_user.id
					})

					this._channels.log.send({ embed: {
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
				} catch (ex) {
					console.error(ex)
					this._channels.log.send({ embed: {
						color: 0xff0000,
						description: `Ошибка добавления записи.\n\n\`\`\`${ex}\`\`\``,
						author: {
							name: 'Новая англодева',
							icon_url: this._bot.user.avatarURL,
							url: config.site
						},
					}})
				}
			}

			// иди погуляй
			if((old_user.roles.has(config.roles.angel_maiden) || old_user.roles.has(config.roles.angel_maiden_half)) &&
				(!new_user.roles.has(config.roles.angel_maiden) && !new_user.roles.has(config.roles.angel_maiden_half))
			) {
				try {
					const maiden = await this._maidens.findOneAndRemove({
						id: new_user.id
					})

					this._channels.log.send({ embed: {
						color: 0x00bfff,
						author: {
							name: 'Бывшая англодева',
							icon_url: this._bot.user.avatarURL,
							url: config.site
						},
						fields: [{
							name: maiden['nick'],
							value: `${new_user}`
						}]
					}})
				} catch (ex) {
					console.error(ex)
					this._channels.log.send({ embed: {
						color: 0xff0000,
						description: `Ошибка удаления записи.\n\n\`\`\`${ex}\`\`\``,
						author: {
							name: 'Бывшая англодева',
							icon_url: this._bot.user.avatarURL,
							url: config.site
						},
					}})
				}
			}
		})
	}

	constructor(
		maidens: Model <Document>,
		bot: Client,
		guilds: CGuilds,
		channels: CChannels
	) {
		this._maidens = maidens
		this._bot = bot
		this._guilds = guilds
		this._channels = channels

		this.init()
	}

	async edit(message: Message, signature: string, new_nick: string): Promise <void> {
		if (!message.member.hasPermission (Permissions.FLAGS.ADMINISTRATOR)) { return }

		if(!signature) { 
			throw "Введи ник или DiscordID"
		}

		const angel_maiden = 
			await this._maidens.findOne({ $or: [{ 
				id: signature
			}, {
				nick: signature
			}] })

		if(!angel_maiden) { 
			throw "Нет такой англодевы"
		}

		if(!new_nick || new_nick === angel_maiden['nick']) {
			throw "Введи новый ник"
		}

		this._maidens.update({
			_id: angel_maiden._id
		}, {
			$set: { nick: new_nick }
		})
	}

	async set(message: Message, new_nick: string): Promise <void> {
		const angel_maiden = await this._maidens.findOne({ id: message.member.id })
		
		if(!angel_maiden) { 
			throw 'Ошибка'
		 }

		if(!new_nick) {
			throw "Введи новый ник"
		}

		this._maidens.update({
			_id: angel_maiden._id
		}, {
			$set: { nick: new_nick }
		})
	}

	/**
	 * @param {Message} message discord message
	 * @param {number} page number of page to output
	 * @param {number} limit count of fields to output. 25 - default discord fields limit
	 */
	public async list(page: number, limit: number = 25): Promise <CMaidenManagementList>{		
		const maidens: number = await this._maidens.estimatedDocumentCount()
		
		const offset = (--page) * limit
		const angel_maidens = await this._maidens.find().skip((offset >= maidens || offset < 0) ? (page = 0) : offset).limit(limit) 
		
		if(angel_maidens.length <= 0) { throw null }

		return {
			page: page + 1,
			total: Math.ceil(maidens / limit),
			list: angel_maidens
		}
	}
}