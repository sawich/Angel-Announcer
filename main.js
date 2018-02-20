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

const Discord = require ("discord.js")
const bot = new Discord.Client ()

const express = require ('express')
const app = express ()

const bodyParser = require ('body-parser')
app.use (bodyParser.json ())
app.use (bodyParser.urlencoded ({ extended: true }))

const config = require ('./config')
const team = config.team

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

	for (const person of team.values ()) {
		person.member = guild.member (person.discordid)
		if (!person.member) {
			console.log (`member [id:${person.discordid}] not found`)
			process.abort ()
		}
	}

	app.post ('/', (req, res) => {
		const body = req.body

		switch (body.type) {
			case 'wall_post_new':
				update_posts (body.object.text)
			break
			case 'confirmation':
				res.send (config.vk.confirmation)
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

update_posts = (_str) => {
	if (!_str.includes (config.vk.tag)) { return }

	// users link replace to discord users
	const angel_info_regexp = /\[ (id|club) (\d+)\| ([a-zA-z][a-zA-Z0-9_.]+)\]/gi

	let angel_info = null
	while (null != (angel_info = angel_info_regexp.exec (_str))) {
		const angel = team.get (angel_info[3])

		let user = angel ? angel.member : angel_info[3]
		_str = _str.replace (angel_info[0], user)
	}

	// readers link replace to discord-like link
	const link_info_regexp = /# (\S+): (\S+)/gi

	let link_info = null
	let fields = []
	while (null != (link_info = link_info_regexp.exec (_str))) {
		fields.push ({
			name: `${link_info[1]}`,
			value: `[тык] (${link_info[2]})`,
			inline: true
		})
	}

	channel.announcement.send ({ embed: {
		author: {
			name: _str.split ('\n')[0],
			icon_url: bot.user.avatarURL,
			url: config.site
		},
		fields,
		color: 0x00bfff,
		description: `*${_str.match (/ (Над главой работали: .*?)\n/i)[1].trim ()}*`,
		footer: {
			text: _str.match (/ (Переведено с .*?)[\.|\n]/i)[0],
			icon_url: config.team_icon_url
		}
	}})
}

bot.login (config.discord.token)