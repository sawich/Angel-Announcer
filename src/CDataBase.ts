//import { Loki, Collection } from "@lokidb/loki"
import { Loki, Collection } from "@lokidb/loki/types/loki/src"
import { FSStorage } from "@lokidb/fs-storage"
import { existsSync, mkdirSync } from "fs";

export interface CDataBaseMaidenModel {
	nick: string
	discordid: string
}

export class CDataBase {

	private _maidens: Collection <CDataBaseMaidenModel>

	async load() {
		if (!existsSync('./build/database')) {
			mkdirSync('./build/database')
		}

		const database = new Loki('./build/database/angeldev.json')

		try {
			const adapter: FSStorage = new FSStorage
			await database.initializePersistence({ adapter, autosave: true })
		} catch (ex) {
			console.trace(ex)
			process.exit(1)
		}

		if (existsSync(database.filename)) {
			try {
				await database.loadDatabase({})
			} catch (ex) {
				console.trace(ex)
				process.exit(1)
			}
		}

		this._maidens = database.getCollection <CDataBaseMaidenModel> ('maidens')
		if (null === this._maidens) {
			this._maidens = database.addCollection <CDataBaseMaidenModel> ('maidens', {
				unique: [ 'nick', 'discordid' ]
			})
		}
	}

	constructor() {}

	get maidens() { return this._maidens }

}