import config from './config/config.js'
import { CGuilds } from './CGuilds'

import { TextChannel } from "discord.js"

export class CChannels {

	private _log: TextChannel
	private _test: TextChannel
	private _comments_mangachan: TextChannel
	private _comments_readmanga: TextChannel
	private _announcement: TextChannel
		
	constructor(guilds: CGuilds) {
		this._log = guilds.main.channels.get (config.channelid.log) as TextChannel
		if (!this._log) {
			console.log (`channels.log [id:${config.channelid.log}] not found`)
			process.exit(1)
		}
		
		this._test = guilds.main.channels.get (config.channelid.test) as TextChannel
		if (!this._test) {
			console.log (`channels.test [id:${config.channelid.test}] not found`)
			process.exit(1)
		}
		
		this._comments_mangachan = guilds.main.channels.get (config.channelid.comments.mangachan) as TextChannel
		if (!this._comments_mangachan) {
			console.log (`channels.comments.mangachan [id:${config.channelid.comments.mangachan}] not found`)
			process.exit(1)
		}
		
		this._comments_readmanga = guilds.main.channels.get (config.channelid.comments.readmanga) as TextChannel
		if (!this._comments_readmanga) {
			console.log (`channels.comments.readmanga [id:${config.channelid.comments.readmanga}] not found`)
			process.exit(1)
		}
		
		this._announcement = guilds.main.channels.get (config.channelid.announcement) as TextChannel
		if (!this._announcement) {
			console.log (`channels.announcement [id:${config.channelid.announcement}] not found`)
			process.exit(1)
		}
	}

	// channel for logs | \WoW/
	public get log(): TextChannel { return this._log }

	// channel for deve test's
	public get test(): TextChannel { return this._test }

	// канал с комментариями к релизам с читалок
	public get comments_mangachan(): TextChannel { return this._comments_mangachan }

	// канал с комментариями к релизам с читалок
	public get comments_readmanga(): TextChannel { return this._comments_readmanga }

	// channel for announcement manga
	public get announcement(): TextChannel { return this._announcement }

}