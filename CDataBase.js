const loki = require('lokijs')

module.exports = class CDataBase {
	constructor() {
		Promise.all([
			new Promise((resolve) => {
				this.database = new loki('database_angeldev.json', {
					autoload: true,
					autosave: true,
					autosaveInterval: 4000,
					autoloadCallback: () => {
						this._maidens = this.database.getCollection('maidens')
						
						if (null === this._maidens) {
							this._maidens = this.database.addCollection('maidens', {
								unique: ['name', 'discordid']
							})
						}
						resolve()
					}
				})
			})
		])
	}

	get maidens() { return this._maidens }
}