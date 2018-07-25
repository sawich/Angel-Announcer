import { connect, Schema, model, Document, Model } from 'mongoose'

const CDataBaseMaidenModelSchema = new Schema({
	discord_id: {
		type: String,
		unique: true,
		required: true
	},
	nick: {
		type: String,
		unique: true,
		required: true
	}
}, { 
	timestamps: false, 
	collection: 'angelmaidens'
 })

export class CDataBase {

	private _maidens: Model <Document>

	/**
	 * load
	 */
	public async load() {
		try {
			await connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWD}@ds247101.mlab.com:47101/angeldev`, { useNewUrlParser: true })		
		} catch (ex) {
			console.error(ex)
			process.exit(1)
		}		
	}

	constructor() {
		this._maidens = model('CDataBaseMaidenModel', CDataBaseMaidenModelSchema)
	}

	get maidens() { return this._maidens }

}