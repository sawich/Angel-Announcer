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
const test_msg = '\
Истории школьниц | Глава 13 | Трудно быть старшеклассницей!\n\
\n\
Над главой работали: [id86382408|Sawich], [club149052453|safasf]\n\
—\n\
#mintmanga: https://vk.cc/7JnMjj\n\
#mangachan: https://vk.cc/7JnM8t\n\
#onedrive: https://vk.cc/7D2E0R\n\
—\n\
Переведено с английского языка.\n\
—\n\
#releases@angeldevmanga | #tags'
*/
const Discord = require ("discord.js")
const bot = new Discord.Client ()

const express = require ('express')
const app = express ()

const bodyParser = require ('body-parser')
app.use (bodyParser.json ())
app.use (bodyParser.urlencoded ({ extended: true }))

const fs = require ('fs')
const config = require ('./config')
const team = new Map

let guild = null
let channel = {
	log: null,
	test: null,
	announcement: null
}

bot.on ('ready', () => {
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

	const config_team = require ('./config-team.json')
	for (const person of config_team) {
		const member = guild.member (person.discordid)
		if (!member) {
			console.log (`member [id:${person.discordid}] not found`)
			process.abort ()
		}
		team.set (person.nick, member)
	}

	app.post ('/', (req, res) => {
		const body = req.body

		switch (body.type) {
			case 'wall_post_new':
				send_discord_post (body.object.text)
			break
			case 'confirmation':
				res.send (config.vk.confirmation)
				
				channel.log.send ({ embed: {
					color: 0xffff00,
					description: `VK confirmation request [clubid:${body.group_id}]`,
					author: {
						name: bot.user.username,
						icon_url: bot.user.avatarURL,
						url: config.site
					},
				}})
				return
			break
		}

		res.sendStatus (200)
	})

	app.listen (80, function () {
		console.log ('Listening on port 80!')
		channel.log.send ({ embed: {
			color: 0x00ff00,
			description: 'Back-end connected',
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
		if (!message.member.roles.has (config.discord.role.admin)) { return }

		if ('undefined' === typeof nick) {
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

		if (!team.delete (nick)) {
			message.reply ({ embed: {
				color: 0xff0000,
				description: `Does not exist`,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL,
					url: config.site
				},
			}})
			return
		}

		const config_team = require ('./config-team.json')
		config_team.splice (config_team.findIndex (e => e.nick == nick), 1)

		fs.writeFileSync ('./config-team.json',
			JSON.stringify (config_team, null, 4))

		message.reply ({ embed: {
			color: 0x00ff00,
			description: `Successful`,
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})
	}],
	[ 'add', (message, [nick, discordid]) => {
		if (!message.member.roles.has (config.discord.role.admin)) { return }

		if ('undefined' === typeof nick ||
			'undefined' === typeof discordid) {
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

		nick = nick.toLowerCase ()

		if (team.has (nick)) {
			message.reply ({ embed: {
				color: 0xff0000,
				description: `Already exists`,
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

		const config_team = require ('./config-team.json')
		config_team.push ({ nick, discordid })

		fs.writeFileSync ('./config-team.json',
			JSON.stringify (config_team, null, 4))

		team.set (nick, member)

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

const send_discord_post = _str => {
	if (!_str.includes (config.vk.tag)) { return }

	// users link replace to discord users
	const angel_info_regexp = /\[(id|club)(\d+)\|([a-zA-z][a-zA-Z0-9_.]+)\]/gi

	let angel_info = null
	let chapter_workers = []
	while (null != (angel_info = angel_info_regexp.exec (_str))) {
		chapter_workers.push (team.get (angel_info[3].toLowerCase ()) || angel_info[3])
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

bot.login (config.discord.token)