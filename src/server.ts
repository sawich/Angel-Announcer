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

import { CMaidenManagement, CMaidenManagementList, CMaidenManagementItem } from './CMaidenManagement'
import { CVkObserver, group_leave, group_join } from './CVkObserver'
import { CChannels } from './CChannels'
import { CCommands } from './CCommands'
import { CDataBase } from './CDataBase'
import { CGuilds } from './CGuilds'
import { CMediaPlayer } from './CMediaPlayer';
// import { CManga } from './CManga'
// import { CMediaPlayer from './CMediaPlayer'

import { Permissions, Message, Client, GuildMember, RichEmbed, TextChannel, FileOptions } from 'discord.js'
import * as body_parser from 'body-parser'

import * as express from 'express'
import { Request, Response, Express } from 'express'

import { AddressInfo } from 'net';
import { CUserPlaylistManagement } from './CUserPlaylistManagement';
import { Server } from 'http';
import { BitlyClient } from 'bitly/dist/bitly';
import { CGrabberDajiaochongmanhua } from './CGrabberDajiaochongmanhua';
import { IGrabber } from './IGrabber';
import { unlinkSync } from 'fs';
import { CCommentNoticerMangaChan, CommentNoticerMangaChanList_t } from './CCommentNoticerMangaChan';
import { CCommentNoticerReadManga, CommentNoticerReadManga_t } from "./CCommentNoticerReadManga";

class CApp {
	constructor() {
		const bitly = new BitlyClient(process.env.BITLY_TOKEN, {});
		
		new Promise(async () => {
			const database = new CDataBase()
			const database_load = database.load()

			const discord_client: Client = new Client
			
			discord_client.on('error', (ex) => console.error)

			try {
				await discord_client.login(process.env.DISCORD_TOKEN)
			} catch(ex) {
				console.error(ex)
				process.exit(1)
			}
			
			const grabbers = new Map <string, IGrabber> ([[
				'lily', new CGrabberDajiaochongmanhua(1378)
			]])

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

				[ 'grab', async (message: Message, args: string[]) => {
					if(args.length < 2) { return }

					const grabber = await grabbers.get(args.shift())
					if(!grabber) { return }

					const grabbed = await grabber.grab(parseInt(args.shift()))
		
					const embed = new RichEmbed()
						.setColor(0xffff00)
						.setDescription(grabbed.descripion)
						.setAuthor(`${grabbed.title} (${grabbed.name})`, discord_client.user.avatarURL, grabbed.link)
						.setThumbnail(grabbed.thumb)
						.attachFile({    
							attachment: grabbed.path,
							name: `Lily ${grabbed.name}.zip`
						})
				
					await message.reply({ embed })
					unlinkSync(grabbed.path)
				}],

				[ 'links', async (message: Message, args: string[]) => {	
					if(args.length < 1) { return }
		
					const response = await Promise.all(args.map((url: string) => bitly.shorten(url))	)				

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

			server.on('error', async (error) => {
				console.error(error)
				await channels.log.send({ embed: {
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

			/*server.once('listening', () => {
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
			})*/

			//
			/*channels.log.send({ embed: {
				color: 0x00ff00,
				description: `Logged in as ${discord_client.user.tag}!`,
				author: {
					name: guilds.main.member(discord_client.user.id).displayName,
					icon_url: discord_client.user.avatarURL,
					url: config.site
				},
			}})*/

			const yoba = discord_client.emojis.get('430424310050717696')

			const cn_mc = new CCommentNoticerMangaChan(yoba, database.comments)
			const cn_rm = new CCommentNoticerReadManga(database.comments)

			//const log = discord_client.guilds.get('469205724824731648').channels.get('473850605031522315') as TextChannel
			
			const comment_noticer_update = async () => {
				setTimeout(async () => {
					await Promise.all([
						cn_mc.update(async (list: CommentNoticerMangaChanList_t) => {
							for (const comment of list.comments.reverse()) {
								const embed = new RichEmbed()
									.setAuthor(`${list.service.manga_title}`, list.service.icon, list.service.manga_url)
									.setThumbnail(comment.avatar)
									.setTitle(comment.author)
									.setURL(comment.author_link)
									.setDescription(comment.message)
									.setFooter(comment.datetime)
								await channels.comments_mangachan.send({ embed })
							}
						}), 
						cn_rm.update(async (data: CommentNoticerReadManga_t) => {
							const embed = new RichEmbed()
								.setColor(15861924)
								.setAuthor(data.name, 'http://res.readmanga.me/static/apple-touch-icon-a401a05b79c2dad93553ebc3523ad5fe.png', data.url)
					
							type embed_t = { name: string, value: string };
					
							const to_sent = new Array(new Array <embed_t>())
							let current_array_id = 0
							let current_field_id = 0
							let embed_size = 0
							let fields_size = 0
							
							for(const page of data.pages) {
								const current_page = `***[#](${page.url})***`
								
								const page_fields = page.comments.map(comment => `${current_page} \`\`[${comment.datetime}]\`\` ***[${comment.author.replace(/\*/g, '\◘')}](${comment.author_link})*** : ${comment.message.replace(/\*/g, '\▼').replace(/_{2,}/g, '○')}\n`)
								const current_page_title = `— стр. ${1 + page.page_id} —`
								const embed_default_size = data.name.length + current_page_title.length
					
								fields_size += page_fields[0].length
								embed_size += embed_default_size + page_fields[0].length
								if(embed_size >= 5750) {
									to_sent.push(new Array <embed_t> ({
										name: current_page_title,
										value: page_fields[0]
									}))
					
									current_array_id = to_sent.length - 1
									current_field_id = to_sent[current_array_id].length - 1
					
									embed_size = embed_default_size
									fields_size = page_fields[0].length
								} else {
									to_sent[current_array_id].push({
										name: current_page_title,
										value: page_fields[0]
									})
					
									current_field_id = to_sent[current_array_id].length - 1
									fields_size = page_fields[0].length
								}
					
								for(const current of page_fields.slice(1)) {
									fields_size += current.length
									embed_size += current.length
									if(embed_size >= 5750) {
										to_sent.push(new Array <embed_t> ({
											name: current_page_title,
											value: current
										}))
					
										current_array_id = to_sent.length - 1
										current_field_id = to_sent[current_array_id].length - 1
					
										embed_size = embed_default_size
										fields_size = current.length
									} else if(fields_size >= 1024) {
										to_sent[current_array_id].push({
											name: current_page_title,
											value: current
										})
					
										current_field_id = to_sent[current_array_id].length - 1
										fields_size = current.length
									} else {
										to_sent[current_array_id][current_field_id].value += current
									}
								}
							}
					
							for(const s of to_sent) {
								embed.fields = s
								await channels.comments_readmanga.send(embed)
							}
						})
					])
					
					await comment_noticer_update()
				}, 1000/* * 60 * 5*/)
			}
			
			comment_noticer_update()

			console.log(`Logged in as ${discord_client.user.tag}!`)
		})
	}
}

new CApp