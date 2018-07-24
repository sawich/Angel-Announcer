import { Loki, Collection } from "@lokidb/loki"
//import { Loki, Collection } from "@lokidb/loki/types/loki/src"
import { FSStorage } from "@lokidb/fs-storage"
import { existsSync, mkdirSync } from "fs"
import { resolve } from "path";

export interface CDataBaseMaidenModel {
	nick: string
	discordid: string
}

export type CDataBaseMaidenModel_t = Collection <CDataBaseMaidenModel>

export class CDataBase {

	private _maidens: Collection <CDataBaseMaidenModel>

	async load() {
		const dbname = 'angeldev.json'
		const path = resolve(__dirname, 'database')
		if (!existsSync(path)) {
			mkdirSync(path)
		}

		const database = new Loki(resolve(path, dbname))
		const adapter: FSStorage = new FSStorage
		
		try {
			await database.initializePersistence({ adapter, autosave: true, autosaveInterval: 4000 })
		} catch (ex) {
			console.trace(ex)
			process.exit(1)
		}

		if (existsSync(database.filename)) {
			try {
				await database.loadDatabase()
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