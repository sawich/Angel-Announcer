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

//
//
//

interface IDataBaseLastMangaCommentId {
  service: string
  value: number
}

export interface IDataBaseLastMangaCommentIdModel extends IDataBaseLastMangaCommentId, Document {}

const CDataBaseLastMangaCommentIdSchema: Schema = new Schema({
	service: {
		type: String,
    unique: true,
    required: true
	},
	value: {
		type: Number,
    default: 0
	}
}, {
	timestamps: false,
	collection: 'lastmangacommentid'
})

//
//
//

export class CDataBase {
	private _maidens: Model <Document>
	private _comments: Model <IDataBaseLastMangaCommentIdModel>

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
		this._comments = model('CDataBaseLastMangaCommentId', CDataBaseLastMangaCommentIdSchema)
	}

	get maidens() { return this._maidens }
	get comments() { return this._comments }
}