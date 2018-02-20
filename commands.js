module.exports = class CCommands {
	constructor (_cmds) {
		this._cmds = _cmds
	}
    
	async execute (message) {
		const args = message.content.slice(1).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		const cmd = this._cmds.get (command)
		if (!cmd) { return }

		cmd (message, args)
	}
}