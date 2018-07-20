/*
	EXAMPLE MESSAGE
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

import config from './config/config.js'

import { CMaidenManagement } from './CMaidenManagement.js'
import { CVkObserver, group_leave, group_join } from './CVkObserver'
import { CChannels } from './CChannels'
import { CCommands } from './CCommands'
import { CDataBase } from './CDataBase'
import { CGuilds } from './CGuilds'
import { CMediaPlayer } from './CMediaPlayer';
// import { CManga } from './CManga'
// import { CMediaPlayer from './CMediaPlayer'

import { Permissions, Message, Client } from 'discord.js'
import * as body_parser from 'body-parser'

import * as express from 'express'
import { Request, Response, Express } from 'express'

import { Server } from 'http'
import { AddressInfo } from 'net';
import { CUserPlaylistManagement } from './CUserPlaylistManagement.js';



class CApp {
	constructor() {
		new Promise (async () => {

			const discord_client: Client = new Client

			try {
				await discord_client.login(process.env.DISCORD_TOKEN)
			} catch (ex) {
				console.error(ex)
				process.exit(1)
			}

			//
			const guilds                   = new CGuilds(discord_client)
			const channels                 = new CChannels(guilds)
			const database                 = new CDataBase()
			const maiden_management        = new CMaidenManagement(database, discord_client)
			const user_playlist_management = new CUserPlaylistManagement()
			const vk_observer              = new CVkObserver(database, discord_client, guilds, channels)

			//
			const commands = new CCommands(new Map <string, Function> ([
			// CUserManagement

				[ 'user', (message: Message, args: string[]) => {
					if (!message.member.hasPermission (Permissions.FLAGS.ADMINISTRATOR) || !args) { return }

					switch (args.shift()) {
						case 'del': {
							if(!args.length) {
								message.reply({ embed: {
									color: 0xff0000,
									description: 'Введи ник',
									author: {
										name: discord_client.user.username,
										icon_url: discord_client.user.avatarURL,
										url: config.site
									},
								}})
								return
							}

							maiden_management.delete(message, args[0])
							break
						}
						case 'list': {
							maiden_management.list(message)
							break
						}
						case 'add': {
							if(args.length < 2) {
								message.reply({ embed: {
									color: 0xff0000,
									description: 'Введи ник и discord id',
									author: {
										name: discord_client.user.username,
										icon_url: discord_client.user.avatarURL,
										url: config.site
									},
								}})
								return
							}

							maiden_management.add(message, args)
							break
						}
					}
				} ],

				[ 'pl', async (message: Message, args: string[]) => {
					const playlist = await user_playlist_management.get (message)
					
					switch (args.shift()) {
						case 'del': break
						case 'add': break
						case 'list': break
					}
				}],

			// CUserPlaylistManagement

				[ 'ping', (message: Message) => message.reply ('pong')]
			]))

			const media_player: CMediaPlayer = new CMediaPlayer(discord_client, channels, guilds)
			discord_client.on('message', (message: Message) => {
				if (message.author.bot) { return }

				commands.execute(message)
				 media_player.join(message)
			})

			//
			const app: Express = express()
			app.use (body_parser.json ())
			app.use (body_parser.urlencoded ({ extended: true }))

			app.post ('/', (req: Request, res: Response) => {
				const body = req.body

				switch (body.type) {
				case 'group_join':
					vk_observer.group_join(body as group_join)
				break
				case 'group_leave':
					vk_observer.group_leave(body as group_leave)
				break
				case 'wall_post_new':
					vk_observer.manga_post(body.object.text)
				break
				case 'confirmation':
					vk_observer.confirmation(res, body)
				return
				}

				res.sendStatus (200)
			})


			//
			const server: Server = app.listen(
				parseInt(process.env.PORT) || parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080,
				process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
			)

			server.on('error', error => {
				console.error(error)
				channels.log.send({ embed: {
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
				const addr = server.address() as AddressInfo;

				channels.log.send ({ embed: {
					color: 0x00ff00,
					description: `App listening at http://${addr.address}:${addr.port}`,
					author: {
						name: discord_client.user.username,
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
				}})
			})

			//
			channels.log.send ({ embed: {
				color: 0x00ff00,
				description: `Logged in as ${discord_client.user.tag}!`,
				author: {
					name: discord_client.user.username,
					icon_url: discord_client.user.avatarURL,
					url: config.site
				},
			}})

			console.log (`Logged in as ${discord_client.user.tag}!`)
		})
	}
}

new CApp