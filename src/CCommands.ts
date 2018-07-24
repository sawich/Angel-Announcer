import config from './config/config.js'

import { Message } from 'discord.js'

type commands_t = Map <string, Function>

export interface ICommand {
	command_handler(message: Message, args: string[]) : Promise <void>
}

export class CCommands {
	
	private _cmds: commands_t

	constructor(_cmds: commands_t) {
		this._cmds = _cmds
	}
	
	static async parse_args (str: string) : Promise <string[]> {
		const args = str.match(/"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+/g)
		
		return (args || ['']).join().replace(/"/g, '').split(',')
	}

	async execute (message: Message) : Promise <void> {
		if (!message.content.startsWith (config.discord.prefix)) { 
			return
		}

		const [ command, ...args ] = await CCommands.parse_args (message.content.slice(config.discord.prefix.length).trim())

		const cmd: Function = this._cmds.get (command.toLowerCase())
		if (!cmd) { return }

		cmd (message, args)
	}

}