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

import { CMaidenManagement, CMaidenManagementList, CMaidenManagementItem } from './CMaidenManagement.js'
import { CVkObserver, group_leave, group_join } from './CVkObserver'
import { CChannels } from './CChannels'
import { CCommands } from './CCommands'
import { CDataBase } from './CDataBase'
import { CGuilds } from './CGuilds'
import { CMediaPlayer } from './CMediaPlayer';
// import { CManga } from './CManga'
// import { CMediaPlayer from './CMediaPlayer'

import { Permissions, Message, Client, GuildMember, RichEmbed } from 'discord.js'
import * as body_parser from 'body-parser'

import * as express from 'express'
import { Request, Response, Express } from 'express'

import { post } from 'request-promise-native'
import { AddressInfo } from 'net';
import { CUserPlaylistManagement } from './CUserPlaylistManagement.js';
import { Server } from 'http';
import { BitlyClient } from 'bitly/dist/bitly.js';

class CApp {
	constructor() {
		const bitly = new BitlyClient(process.env.BITLY_TOKEN, {});
		
		new Promise(async () => {
			const database = new CDataBase()
			const database_load = database.load()

			const discord_client: Client = new Client
			
			try {
				await discord_client.login(process.env.DISCORD_TOKEN)
			} catch(ex) {
				console.error(ex)
				process.exit(1)
			}
			
			//
			const guilds   = new CGuilds(discord_client)
			const channels = new CChannels(guilds)

			process.on('uncaughtException', (ex) => {
				channels.log.send({ embed: {
					color: 0xff0000,
					title: `${ex.message}`,	
					description: `\`\`\`${ex.stack}\`\`\``,
					author: {
						name: guilds.main.member(discord_client.user.id).displayName,
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					timestamp: new Date
				}}).catch(console.error)

				console.error((new Date).toUTCString() + ' uncaughtException:', ex.message)
				console.error(ex.stack)
			})
			
			await database_load

			const maiden_management = new CMaidenManagement(database.maidens, discord_client, guilds, channels)

			maiden_management.once('maintenance_add', async (angelmaidens: GuildMember[]) => {
				channels.log.send({ embed: {
					color: 0x00ff00,
					description: angelmaidens.length > 25 ? `25 из ${angelmaidens.length}` : '',
					author: {
						name: 'Новые англодевы',
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					fields: angelmaidens.slice(0, 25).map((maiden) => ({ name: maiden.id, value: `${maiden}`, inline: true }))
				}})
			})

			maiden_management.once('maintenance_remove',  async (angelmaidens: CMaidenManagementItem[]) => {
				channels.log.send({ embed: {
					color: 0xffff00,
					description: angelmaidens.length > 25 ? `25 из ${angelmaidens.length}` : '',
					author: {
						name: 'Бывшие англодевы',
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					fields: angelmaidens.slice(0, 25).map((maiden) => ({ name: maiden.nick, value: `${maiden.member || '—'}`, inline: true }))
				}})
			})

			maiden_management.on('add', async (member: GuildMember) => {
				channels.log.send({ embed: {
					color: 0x00ff00,
					author: {
						name: 'Новая англодева',
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					fields: [{
						name: member.id,
						value: `${member}`
					}]
				}})
			})

			maiden_management.on('remove', async (angelmaiden: CMaidenManagementItem) => {
				channels.log.send({ embed: {
					color: 0xffff00,
					author: {
						name: 'Бывшая англодева',
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					fields: [{
						name: angelmaiden.nick,
						value: `${angelmaiden.member || '—'}`
					}]
				}})
			})

			maiden_management.load()

			const user_playlist_management = new CUserPlaylistManagement()
			const vk_observer              = new CVkObserver(database, discord_client, guilds, channels)
			const media_player             = new CMediaPlayer(discord_client, channels, guilds)

			//
			const commands = new CCommands(new Map <string, Function> ([

				[ 'links', async (message: Message, args: string[]) => {	
					if(args.length < 1) { return }

					const links = args.map((url: string) => bitly.shorten(url))					
					const response = await Promise.all(links)				

					message.reply({ embed: {
						color: 0x00bfff,
						author: {
							name: 'Ссылки',
							icon_url: discord_client.user.avatarURL,
							url: config.site
						},
						fields: response.map(link => ({
							name: (new URL(link['long_url'])).hostname,
							value: link['url']
						}))
					}})
				}],
			// CUserManagement
				[ 'maidens', async (message: Message, args: string[]) : Promise <void> => {
					if (!args) { return }

					switch (args.shift()) {
					// список дев
					case 'list': 
						try {
							const result: CMaidenManagementList = await maiden_management.list(parseInt(args[0]) || 1)
						 
							message.reply({ embed: {
								color: 0x00bfff,
								footer: {
									text: `Страница ${result.page} из ${ result.total }`,
								},
								author: {
									name: 'Англодевы',
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
								fields: result.list.map((angel_maiden) => {
									const find = message.guild.members.get(angel_maiden['discord_id'])
									return { name: angel_maiden['nick'], value:(find ? `*${find}*` : '*—*'), inline: true }
								})
							}})
						} catch {
							message.reply({ embed: {
								color: 0x00bfff,
								author: {
									name: 'Англодевы',
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
								description: '*Пусто*'
							}})
						}
					break
					// редакт админом
					case 'edit': 
						try {
							await maiden_management.edit(message, args[0], args[1])
							message.reply({ embed: {
								color: 0x00ff00,
								description: 'Обновлено',
								author: {
									name: guilds.main.member(discord_client.user.id).displayName,
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
							}})
						} catch(ex) {
							message.reply({ embed: {
								color: 0xff0000,
								description: ex,
								author: {
									name: guilds.main.member(discord_client.user.id).displayName,
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
							}})
						}
					break
					// редакт себя юзером
					case 'set': 
						try {
							await maiden_management.set(message, args[0])
							message.reply({ embed: {
								color: 0x00ff00,
								description: 'Обновлено',
								author: {
									name: guilds.main.member(discord_client.user.id).displayName,
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
							}})
						} catch(ex) {
							message.reply({ embed: {
								color: 0xff0000,
								description: ex,
								author: {
									name: guilds.main.member(discord_client.user.id).displayName,
									icon_url: discord_client.user.avatarURL,
									url: config.site
								},
							}})
						}
					break
					}
				} ],

				[ 'pl', async(message: Message, args: string[]) => {
					const playlist = await user_playlist_management.get(message)
					
					switch(args.shift()) {
						case 'del': break
						case 'add': break
						case 'list': break
					}
				}],

			// CUserPlaylistManagement

				[ 'ping', (message: Message) => message.reply('pong')]
			]))

			discord_client.on('message', (message: Message) => {
				if(message.author.bot) { return }

				commands.execute(message)
				 media_player.join(message)
			})

			//
			const app: Express = express()
			app.use(body_parser.json())
			app.use(body_parser.urlencoded({ extended: true }))

			app.post('/', (req: Request, res: Response) => {
				const body = req.body

				switch(body.type) {
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

				res.sendStatus(200)
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
						name: guilds.main.member(discord_client.user.id).displayName,
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
				}})
				process.exit(1)
			})

			server.once('listening', () => {
				const addr = server.address() as AddressInfo;

				channels.log.send({ embed: {
					color: 0x00ff00,
					description: `App listening at http://${addr.address}:${addr.port}`,
					author: {
						name: guilds.main.member(discord_client.user.id).displayName,
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
				}})
			})

			//
			channels.log.send({ embed: {
				color: 0x00ff00,
				description: `Logged in as ${discord_client.user.tag}!`,
				author: {
					name: guilds.main.member(discord_client.user.id).displayName,
					icon_url: discord_client.user.avatarURL,
					url: config.site
				},
			}})

			console.log(`Logged in as ${discord_client.user.tag}!`)
		})
	}
}

new CApp