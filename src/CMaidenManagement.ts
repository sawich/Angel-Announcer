import config from './config/config.js'
import { CDataBase } from './CDataBase.js'
import { CGuilds } from './CGuilds.js'

import { Client, Message, GuildMember, Permissions } from 'discord.js'
import { CChannels } from './CChannels.js';
import { Model, Document, Types } from 'mongoose';

import { EventEmitter } from "events";

export type CMaidenManagementList = {
	page: number,
	total: number,
	list: Array <Document>
} 

export type CMaidenManagementItem = {
	member: GuildMember,
	nick: String
}

export class CMaidenManagement extends EventEmitter {
	private _maidens: Model <Document>
	private _bot: Client
	private _guilds: CGuilds
	private _channels: CChannels

	async load() {
		const docs = await this._maidens.find({})

		const angelmaidens = [
			...Array.from(this._guilds.main.roles.get(config.roles.angel_maiden).members.values()),
			...Array.from(this._guilds.main.roles.get(config.roles.angel_maiden_half).members.values())
		]

		// добавление англодев, которые получили крылья, пока бот спал
		const new_angelmaidens = angelmaidens.filter((angelmaiden) => {
			if(undefined !== docs.find((value) => value['discord_id'] == angelmaiden.id)) {
				return false;
			}

			this._maidens.create({
				discord_id: angelmaiden.id,
				nick: angelmaiden.id
			})

			return true
		})

		if(new_angelmaidens.length > 0) {
			super.emit('maintenance_add', new_angelmaidens)
		}

		// удаление англодев, которые утратили крылья, пока бот спал
		const roles = [ config.roles.angel_maiden, config.roles.angel_maiden_half ]

		const ex_angelmaidens = docs.reduce((array:CMaidenManagementItem[], angel_maiden) => {
			const member = this._guilds.main.members.get(angel_maiden['discord_id'])
			if(!member || !member.roles.some((role) => roles.includes(role.id))) {
				array.push({
					member,
					nick: angel_maiden['nick']
				})
				angel_maiden.remove()
			}

			return array
		}, [])
		

		if(ex_angelmaidens.length > 0) {
			super.emit('maintenance_remove', ex_angelmaidens)
		}		

		//
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
						discord_id: new_user.id
					})

					super.emit('add', new_user)
				} catch (ex) {
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
						discord_id: new_user.id
					})

					super.emit('remove', {
						member: new_user, nick: maiden['nick']
					})
				} catch (ex) {
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
		super()

		this._maidens = maidens
		this._bot = bot
		this._guilds = guilds
		this._channels = channels
	}

	async edit(message: Message, signature: string, new_nick: string): Promise <void> {
		if (!message.member.hasPermission (Permissions.FLAGS.ADMINISTRATOR)) { return }

		if(!signature) { 
			throw "Введи ник или DiscordID"
		}

		const angel_maiden = await this._maidens.findOne().or([ { discord_id: signature }, { nick: signature }])

		if(!angel_maiden) { 
			throw "Нет такой англодевы"
		}

		if(!new_nick || new_nick === angel_maiden['nick'] || !!(await this._maidens.findOne({ nick: new_nick }))) {
			throw "Введи новый ник"
		}

		await angel_maiden.update({
			$set: { nick: new_nick }
		})
	}

	async set(message: Message, new_nick: string): Promise <void> {
		const angel_maiden = await this._maidens.findOne({ discord_id: message.member.id })
		
		if(!angel_maiden) { 
			throw 'Ошибка'
		 }

		if(!new_nick || new_nick === angel_maiden['nick'] || !!(await this._maidens.findOne({ nick: new_nick }))) {
			throw "Введи новый ник"
		}
		
		await angel_maiden.update({
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