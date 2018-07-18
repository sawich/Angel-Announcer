const config = require ('./config.js')

module.exports = class CGuilds {
	constructor(discord_client) {		
		this._main = discord_client.guilds.get (config.guildid.main)
		if (!this._main) {
			console.error (`guild [id:${config.guildid.main}] not found`)
			process.exit(1)
		}

		this._storage = discord_client.guilds.get (config.guildid.storage)
		if (!this._storage) {
			console.error (`guild [id:${config.guildid.storage}] not found`)
			process.exit(1)
		}
	}

	// general manga server
	get main() { return this._main }

	// storage server
	get storage() { return this._storage }
}