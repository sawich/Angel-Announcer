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

const config = require ('./config.js')

const CUserManagement = require('./CUserManagement')
const CVkObserver     = require('./CVkObserver')
const CChannels       = require('./CChannels')
const CCommands       = require('./CCommands')
const CDataBase       = require('./CDataBase')
const CGuilds         = require('./CGuilds')

const discord = require ("discord.js")
const body_parser = require ('body-parser')
const express = require('express')()


express.use (body_parser.json ())
express.use (body_parser.urlencoded ({ extended: true }))



class CApp {
	async init () {		
		const discord_client = new discord.Client()
		
		try {
			await discord_client.login(process.env.DISCORD_TOKEN)
		} catch (ex) {
			console.error(ex)
			process.exit(1)
		}

		const guilds = new CGuilds(discord_client)
		const channels = new CChannels(guilds)
		const database = new CDataBase() 
		const user_management = new CUserManagement(database, discord_client)
	
		this.commands = new CCommands(new Map([
			[ 'del', (...args) => user_management.delete(...args) ],
			[ 'list', (...args) => user_management.list(...args) ],
			[ 'add', (...args) => user_management.add(...args) ],
			[ 'ping', message => message.reply ('pong')]
		]))

		const vk_o = new CVkObserver(database, discord_client, guilds, channels)
	
		express.post ('/', (req, res) => {
			const body = req.body
	
			switch (body.type) {
				case 'group_join':
					vk_o.group_join(body.object)
				break
				case 'group_leave':
					vk_o.group_leave(body.object)
				break
				case 'wall_post_new':
					vk_o.manga_post(body.object.text)
				break
				case 'confirmation':
					res.send (process.env.VK_CON)
					
					return channels.log.send ({ embed: {
						color: 0xffff00,
						description: `VK confirmation request [clubid:${body.group_id}]`,
						author: {
							name: discord_client.user.username,
							icon_url: discord_client.user.avatarURL,
							url: config.site
						},
					}})
			}
	
			res.sendStatus (200)
		})
	
		const server = express.listen(
			process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
			process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
		)
	
		server.on('error', error => {
			console.error(error)
			channels.log.send ({ embed: {
				color: 0xff0000,
				description: `${error}`,
				author: {
					name: discord_client.user.username,
					icon_url: discord_client.user.avatarURL,
					url: config.site
				},
			}})
			process.exit(1)
		})
		
		server.once('listening', () => {		
			channels.log.send ({ embed: {
				color: 0x00ff00,
				description: `App listening at http://${server.address().address}:${server.address().port}`,
				author: {
					name: discord_client.user.username,
					icon_url: discord_client.user.avatarURL,
					url: config.site
				},
			}})	
		})

		discord_client.on('message', (...args) => this.OnDiscordMessage(...args))
	}

	constructor() {
		this.init()
	}

	async OnDiscordMessage(message) {
		this.commands.execute (message)
	}
}

new CApp

/*

		channels.log.send ({ embed: {
			color: 0x00ff00,
			description: 'Discord init',
			author: {
				name: bot.user.username,
				icon_url: bot.user.avatarURL,
				url: config.site
			},
		}})

		console.log (`Logged in as ${bot.user.tag}!`)
	} 
})*/