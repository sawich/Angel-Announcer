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

import { Message, Client, GuildMember, RichEmbed, TextChannel } from 'discord.js'
import * as body_parser from 'body-parser'

import * as express from 'express'
import { Request, Response, Express } from 'express'

import { Server } from 'http';
import { BitlyClient } from 'bitly/dist/bitly';
import { CGrabberDajiaochongmanhua } from './CGrabberDajiaochongmanhua';
import { IGrabber } from './IGrabber';
import { unlinkSync } from 'fs';

import * as notifications from './notifications'

import * as scans from './observers/scans'
import { mangachan, grouple } from './parsers'
import * as comments from './comments'

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

			discord_client.on ('guildMemberRemove', (member: GuildMember) => {
				channels.log.send({ embed: {
					color: 0xffff00,
					author: {
						name: 'Users',
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
					fields: [{
						name: member.displayName,
						value: `Покидает сервер`
					}]
				}})
			})

			const guilds   = new CGuilds(discord_client)
      const channels = new CChannels(guilds)

			const grabbers = new Map <string, IGrabber> ([[
				'lily', new CGrabberDajiaochongmanhua(1378)
			], [
				'lala', new CGrabberDajiaochongmanhua(2328)
			]])

			//

			process.on('unhandledRejection', (reason: Error | any, p: Promise <any>) => {
        channels.log.send ({ embed: {
          color: 0xFF0000,
          title: reason.name,
          description: reason.message,
          fields: [{
            name: 'stack trace',
            value: `\`\`\`ps\n${reason.stack}\`\`\``
          }],
					author: {
						name: guilds.main.member(discord_client.user.id).displayName,
						icon_url: discord_client.user.avatarURL,
						url: config.site
					},
          timestamp: new Date
        }}).catch(console.error)

				console.error((new Date).toUTCString() + ' unhandledRejection:', reason.message)
				console.error(reason.stack)
			})

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


      const yoba = discord_client.emojis.get('430424310050717696')

      const mc = new comments.service (
        new comments.base.single (
          discord_client,
          guilds,
          'http://mangachan.me/translation/70489/',
          'mangachan.me',
          'https://media.discordapp.net/attachments/473850605031522315/475441620406501387/favicon.png',
          0x3baaef, channels.test, channels, database.comments
        ),
        new mangachan (yoba))

      const mm = new comments.service (
        new comments.base.multiple (
          discord_client,
          guilds,
          'http://mintmanga.com/list/person/angeldev',
          'mintmanga.com',
          'https://cdn.discordapp.com/attachments/407454794056204290/524706486572810270/cbdn8-xrzud.png',
          0x9ff12b, channels.test, channels, database.comments
        ),
        new grouple ())

      const rm = new comments.service (
        new comments.base.multiple (
          discord_client,
          guilds,
          'http://readmanga.me/list/person/angeldev',
          'readmanga.me',
          'https://images-ext-1.discordapp.net/external/yarTrkbfii08uiLg4t3976lJ8UO7vTJ911m0HlGFZbs/https/images-ext-2.discordapp.net/external/hJe0w-3ID-KwQvUA9lvoVW6DJznQkQ6Ht1_9uYN8Tvw/http/res.readmanga.me/static/apple-touch-icon-a401a05b79c2dad93553ebc3523ad5fe.png?width=16&height=16',
          0xedd644, channels.test, channels, database.comments
        ),
        new grouple ())

      const comments_services = new Map ([
        [ 'mc', mc ],
        [ 'mm', mm ],
        [ 'rm', rm ]
      ])
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

			const vk_observer  = new CVkObserver(database, discord_client, guilds, channels)

			//
			const commands = new CCommands(new Map <string, Function> ([
        [ 'notifier', async (message: Message, [ cmd, srv ]: string) => {
          switch (cmd) {
            case 'links': {
              const service = comments_services.get (srv)
              if (undefined == service) { return }

              return message.reply ({ embed: {
                color: service.color,
                title: 'Список манги',
                description: (await service.links ()).map ((link, index) => `\`\`${('0' + index).slice (-2)}\`\` ***[${link.name}](${link.link})***`).join ('\n'),
                author: {
                  name: guilds.main.member(discord_client.user.id).displayName,
                  icon_url: discord_client.user.avatarURL,
                  url: service.translator_url
                },
                thumbnail: {
                  url: service.icon_url
                },
                footer: {
                  text: service.service
                },
                timestamp: new Date
              }})
            }
          }
        }],
				[ 'grab', async (message: Message, args: string[]) => {
					if(args.length < 2) { return }

					const grabber = await grabbers.get(args.shift())
					if(!grabber) { return }

					const grabbed = await grabber.grab(parseInt(args.shift()))

					const embed = new RichEmbed()
						.setColor(0xffff00)
						.setDescription(grabbed.description)
						.setAuthor(`${grabbed.title} (${grabbed.name})`, discord_client.user.avatarURL, grabbed.link)
						.setThumbnail(grabbed.thumb)
						.attachFile({
							attachment: grabbed.path,
							name: `${grabbed.title} ${grabbed.name}.zip`
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
				} ]
			]))

			discord_client.on('message', (message: Message) => {
				if(message.author.bot) { return }

				commands.execute(message)
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

			new notifications.comments (Array.from (comments_services.values ()), discord_client, channels, guilds)

      console.log(`Logged in as ${discord_client.user.tag}!`)

      channels.log.send ({ embed: {
        color: 0x00bfff,
        description: 'Сервис перезапущен',
        author: {
          name: guilds.main.member(discord_client.user.id).displayName,
          icon_url: discord_client.user.avatarURL,
          url: config.site
        },
        timestamp: new Date
      }}).catch(console.error)
		})
	}
}

new CApp()

// const launch = async () => {

// const discord_client: Client = new Client
// await discord_client.login('NDE0OTM4Mjg3NzI0MTY3MTY4.Di_J4A.y952uHLCu41i2Hst9f0Qi7Fpqwo')


// const guild = discord_client.guilds.get ('469205724824731648')
// const log = guild.channels.get ('473850605031522315') as TextChannel


// new CApp
// const lhscans = new scans.lhscan

// lhscans.link_add ('https://lhscan.net/manga-parallel-paradise-raw.html')
// lhscans.link_add ('https://lhscan.net/manga-isekai-ryouridou-raw.html')

// lhscans.update_event_subscribe (async (pack: scans.types.mangas) => {
//   const embed = new RichEmbed ()
//   embed.author = {
//     name: pack.provider,
//     icon_url: pack.icon_url,
//     url: pack.url
//   }

//   let current_message = 0

//   let data: {
//     fields: Array <{ name: string; value: string; inline?: boolean; }>
//   }[] = [{
//     fields: []
//   }]

//   for (const page of pack.pages) {
//     if(
//       !!data[current_message].fields.length &&
//       !(data[current_message].fields.length % 25)
//     ) {
//       data.push({
//         fields: []
//       })
//       ++current_message
//     }

//     data[current_message].fields.push ({
//       name: page.name,
//       value: `[открыть на сайте](${page.link})`,
//       inline: false
//     })
//   }

//   for (const message of data) {
//     await log.send ({ embed: { ...embed, ...message } })
//   }

// })

// await lhscans.update ()
// process.exit(0)

// }

// launch ()