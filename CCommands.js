const config = require ('./config.js')

module.exports = class CCommands {
	constructor(_cmds) {
		this.cmds = _cmds
	}
    
	async execute (message) {
		if (!message.content.startsWith (config.discord.prefix)) { return }

		const args = message.content.slice(config.discord.prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		const cmd = this.cmds.get (command)
		if (!cmd) { return }

		cmd (message, args)
	}
}