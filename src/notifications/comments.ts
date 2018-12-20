import * as observers_comments from '../observers/comments'
import { Client, RichEmbed, TextChannel } from 'discord.js'
import { CChannels } from '../CChannels'
import { CDataBase } from '../CDataBase'
import { CGuilds } from '../CGuilds'
import config from '../config/config'

export class comments {
	private _discord_client: Client
	private _mangachan: observers_comments.mangachan
	private _readmanga: observers_comments.grouple
	private _mintmanga: observers_comments.grouple
	private _channels: CChannels

  private async _on_error (message: Error) {
    this._channels.log.send ({ embed: {
      color: 0xFF0000,
      title: message.name,
      description: message.message,
      fields: [{
        name: 'stack trace',
        value: `\`\`\`ps\n${message.stack}\`\`\``
      }],
      timestamp: new Date
    }})    
  }

  private declOfNum(n: number, titles: string[]) {
    return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
  }

  private async _on_translator_update (service: observers_comments.types.events.update_t) {
    this._channels.log.send ({ embed: {
      color: service.color,
      author: {        
        name: service.name,
        icon_url: service.icon_url,
        url: service.url
      },
      description: 'Список манги обновлён',
      timestamp: `${new Date} |  | ${service.count} ${this.declOfNum (service.count, [ 'линк', 'линка', 'линков' ])}`
    }})    
  }

//
//   MANGACHAN
//

  private async _on_update_single (service: observers_comments.types.single.service_t) {    
    const embed = new RichEmbed()
      .setColor(service.color)
      .setAuthor(`${service.manga.name}`, service.icon, service.manga.url)

    for (const comment of service.manga.comments.reverse ()) {
      embed
        .setThumbnail(comment.avatar)
        .setTitle(comment.author)
        .setURL(comment.author_link)
        .setDescription(comment.message)
        .setFooter(comment.datetime)
      service.channel.send({ embed }).catch(this._on_error)
    }
  }

//
//   GROUPLE (MINMANGA && READMANGA)
//

  private async _on_update_multiple (service: observers_comments.types.multiple.service_t) {
    const embed = new RichEmbed()
      .setColor(service.color)
      .setAuthor(service.manga.name, service.icon, service.manga.url)

    type embed_t = { name: string, value: string };

    const to_sent = new Array(new Array <embed_t>())
    let current_array_id = 0
    let current_field_id = 0
    let embed_size = 0
    let fields_size = 0

    for(const page of service.manga.pages) {
      const current_page = `***[#](${page.url})***`

      const page_fields = page.comments.map(comment => `${current_page} \`\`[${comment.datetime}]\`\` ***[${comment.author.replace(/\*/g, '\◘')}](${comment.author_link})*** : ${comment.message.replace(/\*/g, '\▼').replace(/_{2,}/g, '○')}\n`)
      const current_page_title = `— стр. ${1 + page.page_id} —`
      const embed_default_size = service.manga.name.length + current_page_title.length

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

    for (const field of to_sent) {
      embed.fields = field
      service.channel.send (embed).catch(this._on_error)
    }
  }

	constructor(
    discord_client: Client,
    channels: CChannels,
    database: CDataBase,
    guilds: CGuilds)
  {
    this._discord_client = discord_client
    this._channels = channels

    const yoba = this._discord_client.emojis.get('430424310050717696')
    const launch = async () => {
//
//   MANGACHAN
//
      const mangachan_channel = guilds.main.channels.get (config.channelid.comments.mangachan) as TextChannel
      if (!mangachan_channel) {
        console.error (`mangachan_channel [id:${config.channelid.comments.mangachan}] not found`)
        process.exit(1)
      }
      
      this._mangachan = new observers_comments.mangachan(0x3baaef, mangachan_channel, yoba, database.comments)
      this._mangachan.subscribe_error (this._on_error.bind (this))
      this._mangachan.subscribe_translator_update (this._on_translator_update.bind (this))
      this._mangachan.subscribe_update (this._on_update_single.bind (this))
      await this._mangachan.update_translater_page ()

//
//   MINTMANGA
//

      const mintmanga_channel = guilds.main.channels.get (config.channelid.comments.mintmanga) as TextChannel
      if (!mintmanga_channel) {
        console.error (`mintmanga_channel [id:${config.channelid.comments.mintmanga}] not found`)
        process.exit(1)
      }

      this._mintmanga = new observers_comments.grouple(
        0x9ff12b,
        mintmanga_channel,
        'mintmanga.com',
        'https://cdn.discordapp.com/attachments/407454794056204290/524706486572810270/cbdn8-xrzud.png',
        database.comments
      )
      this._mintmanga.subscribe_error (this._on_error.bind (this))
      this._mintmanga.subscribe_translator_update (this._on_translator_update.bind (this))
      this._mintmanga.subscribe_update (this._on_update_multiple.bind (this))
      await this._mintmanga.update_translater_page ()

//
//   READMANGA
//
      const readmanga_channel = guilds.main.channels.get (config.channelid.comments.readmanga) as TextChannel
      if (!readmanga_channel) {
        console.error (`mintmanga_channel [id:${config.channelid.comments.readmanga}] not found`)
        process.exit(1)
      }

      this._readmanga = new observers_comments.grouple(
        0xedd644,
        readmanga_channel,
        'readmanga.me',
        'https://images-ext-2.discordapp.net/external/hJe0w-3ID-KwQvUA9lvoVW6DJznQkQ6Ht1_9uYN8Tvw/http/res.readmanga.me/static/apple-touch-icon-a401a05b79c2dad93553ebc3523ad5fe.png',
        database.comments
      )
      this._readmanga.subscribe_error (this._on_error.bind (this))
      this._readmanga.subscribe_translator_update (this._on_translator_update.bind (this))
      this._readmanga.subscribe_update (this._on_update_multiple.bind (this))
      await this._readmanga.update_translater_page ()

			this.mangachan ()
			this.mintmanga ()
			this.readmanga ()
    }

    launch ()
	}

	public mangachan(interval: number = 60 * 1000) {
		this._interval(this._mangachan.update, interval)
	}

	public mintmanga(interval: number = 60 * 1000) {
		this._interval(this._mintmanga.update, interval)
	}

	public readmanga(interval: number = 60 * 1000) {
		this._interval(this._readmanga.update, interval)
	}

	private async _interval(callback: Function, intr: number) {
		return callback().finally(setTimeout.bind(this._interval.bind(this, callback, intr), intr))
	}
}