const config = require ('./config.js')

module.exports = class CChannels {
	constructor(guilds) {
		this._log = guilds.main.channels.get (config.channelid.log)		
		if (!this._log) {
			console.log (`channels.log [id:${config.channelid.log}] not found`)
			process.exit(1)
		}

		this._test = guilds.main.channels.get (config.channelid.test)
		if (!this._test) {
			console.log (`channels.test [id:${config.channelid.test}] not found`)
			process.exit(1)
		}

		this._announcement = guilds.main.channels.get (config.channelid.announcement)
		if (!this._announcement) {
			console.log (`channels.announcement [id:${config.channelid.announcement}] not found`)
			process.exit(1)
		}
	}

	// channel for logs | \WoW/
	get log() { return this._log }

	// channel for deve test's
	get test() { return this._test }

	// channel for announcement manga
	get announcement() { return this._announcement }
}