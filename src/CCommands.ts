import config from './config/config.js'

import { Message } from 'discord.js'

type commands_t = Map <string, Function>

export class CCommands {
	
	_cmds: commands_t

	constructor(_cmds: commands_t) {
		this._cmds = _cmds
	}
		
	async execute (message: Message) {
		if (!message.content.startsWith (config.discord.prefix)) { 
			return
		}

		const args: string[] = message.content.slice(config.discord.prefix.length).trim().match(/"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+/g).join().replace(/"/g, '').split(',')
		const command: string = args.shift().toLowerCase();

		const cmd: Function = this._cmds.get (command)
		if (!cmd) { return }

		cmd (message, args)
	}

}