/* EXAMPLE MESSAGE
	Истории школьниц | Глава 13 | Трудно быть старшеклассницей!

	Над главой работали: @id86382408 (Sawich), @club149052453 (safasf)
	—
	#mintmanga: https://vk.cc/7JnMjj
	#mangachan: https://vk.cc/7JnM8t
	#onedrive: https://vk.cc/7D2E0R
	—
	Переведено с английского языка.
	—
	#releases@angeldevmanga | #tags
*/
/*
const _str = '\
Истории школьниц | Глава 13 | Трудно быть старшеклассницей!\n\
\n\
Над главой работали: [id86382408|Sawich], [club149052453|safasf], #hashtagusername1, #hashtagusername2\n\
—\n\
#mintmanga: https://vk.cc/7JnMjj\n\
#mangachan: https://vk.cc/7JnM8t\n\
#onedrive: https://vk.cc/7D2E0R\n\
—\n\
Переведено с английского языка.\n\
—\n\
#releases@angeldevmanga | #tags'
*/

const discord = require ("discord.js")
const bot = new discord.Client ()

const app = require('express')()

const bodyParser = require ('body-parser')
app.use (bodyParser.json ())
app.use (bodyParser.urlencoded ({ extended: true }))

const mongoose = require('mongoose')

let server

const request = require ('request-promise-native')
const fs = require ('fs')
const config = require ('./config.js')

let guild = null
let channel = {
	log: null,
	test: null,
	announcement: null
}

/* --- */

class message {
	static error (message) {
		console.log (message)
		return channel.log.send ({ embed: {
			color: 0xff0000,
			description: `${channel}`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})
	}
}

/* --- */

/* SCHEMAS */

const AngelMaidenSchema = mongoose.Schema({
	nick: { type: String, unique: true },
	discordid: { type: String, unique: true }
})

const AngelMaiden = mongoose.model('AngelMaiden', AngelMaidenSchema)

/* ------ */

bot.once('ready', () => {
	guild = bot.guilds.get (config.guildid)
	if (!guild) {
		console.log (`guild [id:${config.guildid}] not found`)
		process.abort ()
	}

	channel.log = guild.channels.get (config.channelid.log)
	if (!channel.log) {
		console.log (`channel.log [id:${config.channelid.log}] not found`)
		process.abort ()
	}

	channel.test = guild.channels.get (config.channelid.test)
	if (!channel.test) {
		console.log (`channel.test [id:${config.channelid.test}] not found`)
		process.abort ()
	}

	channel.announcement = guild.channels.get (config.channelid.announcement)
	if (!channel.announcement) {
		console.log (`channel.announcement [id:${config.channelid.announcement}] not found`)
		process.abort ()
	}

	app.post ('/', (req, res) => {
		const body = req.body

		switch (body.type) {
			case 'group_join':
				send_discord_group_join_post (body.object)
			break
			case 'group_leave':
				send_discord_group_leave_post (body.object)
			break
			case 'wall_post_new':
				send_discord_post (body.object.text)
			break
			case 'confirmation':
				res.send (process.env.VK_CON)
				
				channel.log.send ({ embed: {
					color: 0xffff00,
					description: `VK confirmation request [clubid:${body.group_id}]`,
					author: {
						name: bot.user.username,
						icon_url: bot.user.avatarURL,
						url: config.site
					},
				}})
			break
		}

		res.sendStatus (200)
	})
	
// mongoose.connect('mongodb://username:password@host:port/database?options...');
	const conn = `mongodb://${process.env.MONGODB_USER || ''}:${process.env.MONGODB_PASSWORD || ''}@${process.env.DATABASE_SERVICE_NAME || 'localhost'}:27017/${process.env.MONGODB_DATABASE || 'angeldev'}`
	mongoose.connect(conn, { 
		useNewUrlParser: true 
	}).catch ((error) => {
		message.error (`${error.message}\nconn: ${conn}`).then (process.exit(1))		
	}).then (() => {			
		channel.log.send ({ embed: {
			color: 0x00ff00,
			description: `DB connected`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})
	})

	server = app.listen(
		process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
		process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
	)

	server.on('error', error => {
		message.error (error)
	})
	
	server.on('listening', () => {		
		channel.log.send ({ embed: {
			color: 0x00ff00,
			description: `App listening at http://${server.address().address}:${server.address().port}`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})	
	})

  channel.log.send ({ embed: {
		color: 0x00ff00,
		description: 'Discord init',
		author: {
			name: bot.user.username,
			icon_url: bot.user.avatarURL,
			url: config.site
		},
	}})
	console.log (`Logged in as ${bot.user.tag}!`);
})

const CCommands = require ('./commands')
const cmds = new CCommands (new Map ([
	[ 'del', (message, [nick]) => {
		if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick) {
			message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD NICK\n\n${config.discord.prefix}del {team-nickname}`,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
			}})
			return
		}

		AngelMaiden.deleteOne({ nick: { $regex: new RegExp(nick, 'i') } }).then((res) => {
			if (res.n <= 0) {
				return message.reply ({ embed: {
					color: 0xff0000,
					description: `Юзверь не найден`,
					author: {
						name: bot.user.username,
						icon_url: bot.user.avatarURL,
						url: config.site
					},
				}})
			}
			return message.reply ({ embed: {
				color: 0x00ff00,
				description: `Юзверь удалён`,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
			}})
		}).catch(message.error)
	}],
	[ 'list', message => {
		if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		AngelMaiden.find().then ((angel_maidens) => {
			message.reply ({ embed: {
				color: 0x00bfff,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
				description: angel_maidens.length > 0 ? '' : '*Пусто*',
				fields: angel_maidens.map ((angel_maiden) => {
					const find = guild.members.get (angel_maiden.discordid)
					return { name: angel_maiden.nick, value: `${find}` || 'Юзверь не найден на сервере', inline: true }
				})
			}})
		}).catch (message.error)
	}],
	[ 'add', (message, [nick, discordid]) => {
		if (!message.member.hasPermission (discord.Permissions.FLAGS.ADMINISTRATOR)) { return }

		if (!nick || !discordid) {
			message.reply ({ embed: {
				color: 0xff0000,
				description: `BAD id or NICK\n\n${config.discord.prefix}add {team-nickname} {discordid}`,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
			}})
			return
		}

		const member = guild.member (discordid)
		if (!member) {
			console.log (`member [id:${discordid}] not found`)
			message.reply ({ embed: {
				color: 0xff0000,
				description: `member [id:${discordid}] not found`,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
			}})
			return
		}

		AngelMaiden.findOneAndUpdate(
			{ nick }, { nick, discordid }, 
			{ upsert: true }
		).catch (message.error)

		message.reply ({ embed: {
			color: 0x00ff00,
			description: `Successful`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})
	}], [ 'ping', message => message.reply ('pong')]
]))

const send_discord_group_join_post = _body => {
	request (`https://api.vk.com/method/users.get?user_ids=${_body.user_id}&fields=photo_50&lang=0&v=5.73`, { json: true })
	.then (res => {
		channel.log.send ({ embed: {
			color: 0x00bfff,
			description: `Подписочка от [${res.response.first_name} ${res.response.last_name}](https://vk.com/id${res.response.id})`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
			thumbnail: {
				url: res.response.photo_50
			}
		}})
	})
	.catch (message.error)
}

const send_discord_group_leave_post = _body => {
	request (`https://api.vk.com/method/users.get?user_ids=${_body.user_id}&fields=photo_50&lang=0&v=5.73`, { json: true })
	.then (async res => {
		channel.log.send ({ embed: {
			color: 0xffff00,
			description: `Отписочка от [${res.response.first_name} ${res.response.last_name}](https://vk.com/id${res.response.id})`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
			thumbnail: {
				url: res.response.photo_50
			}
		}})
	}).catch (message.error)
}

const send_discord_post = _str => {
	if (!_str.includes (config.vk.tag)) { return }

	// users link replace to discord users
	const workers = _str.match (/Над главой работали:\s+(.*)\n/i)[0]
	const angel_info_regexp = /\[(id|club)(\d+)\|(.*?)\]|(#.*?)[,|\n]/gi

	let angel_info = []
	let chapter_workers = []
	while (null != (angel_info = angel_info_regexp.exec (workers))) {
		const angel_name = (angel_info[3] || angel_info[4].slice (1)).trim ()
		
		//AngelMaiden.findOne({ nick: angel_name.toLowerCase () })
		chapter_workers.push (team.get (angel_name.toLowerCase ()) || angel_name)
	}

	// readers link replace to discord-like link
	const link_info_regexp = /#(\S+): (\S+)/gi

	let link_info = null
	let fields = []
	while (null != (link_info = link_info_regexp.exec (_str))) {
		fields.push ({
			name: `${link_info[1]}`,
			value: `[тык](${link_info[2]})`,
			inline: true
		})
	}

	return channel.announcement.send ({ embed: {
		author: {
			name: _str.split ('\n')[0],
			icon_url: bot.user.avatarURL,
			url: config.site
		},
		fields,
		color: 0x00bfff,
		description: `*Над главой работали: ${chapter_workers.join (', ')}*`,
		footer: {
			text: _str.match (/(Переведено с .*?)[\.|\n]/i)[0],
			icon_url: config.team_icon_url
		}
	}})
}

bot.on ('message', message => {
	if (!message.content.startsWith (config.discord.prefix)) { return }

	cmds.execute (message)
})

bot.login (process.env.DISCORD_TOKEN).catch (() => {
	console.error('Token invalid')
	process.exit(1)
})