import { error } from '../utils'
import { types } from './types'
import { JSDOM } from 'jsdom'
import fetch, { RequestInit } from 'node-fetch'
import config from '../config/config'
import { TextChannel, Client, RichEmbed } from 'discord.js'
import { CChannels } from '../CChannels'
import { CGuilds } from '../CGuilds'
import { Model } from 'mongoose'
import { IDataBaseLastMangaCommentIdModel } from '../CDataBase'

export namespace base {
  export class core extends error {
    protected decl_of_num(n: number, titles: string[]) {
      return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
    }

    public async update_tp (parser: types.ICommentsParseService) {
      const translator_page_dom = new JSDOM (
        await (await fetch (this._translator_url, this._request_options)).arrayBuffer (), {
          url: `http://${this._service}`
        })

      this._manga_urls = await parser.translator (translator_page_dom)

      return this._channels.log.send ({ embed: {
        color: this._color,
        author: {
          name: this._guilds.main.member(this._discord_client.user.id).displayName,
          icon_url: this._discord_client.user.avatarURL,
          url: config.site
        },
        url: this._translator_url,
        title: this._service,
        thumbnail: {
          url: this._icon_url
        },
        footer: {
          text: `${this._manga_urls.length} ${this.decl_of_num (this._manga_urls.length, [ 'линк', 'линка', 'линков' ])}`
        },
        description: 'Список манги обновлён',
        timestamp: new Date
      }})
    }

    protected async onUpdateCommentsSelector (
      parser: types.ICommentsParseService,
      notifier: types.single.ICommentNotifier | types.multiple.ICommentNotifier
    ) {
      const db_model = await this._db_comments.findOne({
        service: this._service
      }) || await this._db_comments.create({
        service: this._service,
        value: 0
      })

      const comment_ids = await parser.comments (
        this._manga_urls, db_model.value,
        this._request_options,
        notifier.bind (this),
        this.onError.bind (this))

      db_model.value = Math.max (db_model.value, ...comment_ids)
      return db_model.save().catch (this.onError.bind (this))
    }

    public async links (parser: types.ICommentsParseService) {
      return parser.links (
        new JSDOM (
          await (await fetch (
            this._translator_url, this._request_options)).arrayBuffer (), {
              url: `http://${this._service}`
          })
      )
    }

    get translator_url () { return this._translator_url }
    get service () { return this._service }
    get icon_url () { return this._icon_url }
    get color () { return this._color }

    constructor (
      discord_client: Client,
      guilds: CGuilds,
      translator_url: string,
      service: string,
      icon_url: string,
      color: number,
      channel: TextChannel,
      channels: CChannels,
      db_comments: Model <IDataBaseLastMangaCommentIdModel>
    )
    {
      super (discord_client, guilds, channels)

      this._request_options = {
        method: 'GET',
        compress: true,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'ru,en-US;q=0.7,en',
          'Cache-Control': 'max-age=0',
          'DNT': '1',
          'Host': service,
          'Referer': `http://${service}/`,
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:63.0) Gecko/20100101 Firefox/63.0'
        }
      }

      this._translator_url = translator_url
      this._service = service
      this._icon_url = icon_url
      this._color = color
      this._channel = channel
      this._db_comments = db_comments
      this._manga_urls = []
    }

    protected _request_options: RequestInit
    protected _translator_url: string
    protected _service: string
    protected _icon_url: string
    protected _color: number
    protected _channel: TextChannel
    protected _db_comments: Model <IDataBaseLastMangaCommentIdModel>
    protected _manga_urls: string[]
  }

  export class single extends core {
    protected async onNewComment (manga: types.single.manga_t) {
      const embed = new RichEmbed()
        .setColor(this._color)
        .setAuthor(`${manga.name}`, this._icon_url, manga.url)

      for (const comment of manga.comments.reverse ()) {
        embed
          .setThumbnail(comment.avatar)
          .setTitle(comment.author)
          .setURL(comment.author_link)
          .setDescription(comment.message)
          .setFooter(comment.datetime)
        this._channel.send({ embed }).catch (this.onError)
      }
    }

    public async update_comments (
      parser: types.ICommentsParseService)
    {
      return this.onUpdateCommentsSelector (parser, this.onNewComment.bind (this))
    }

    constructor (
      discord_client: Client,
      guilds: CGuilds,
      translator_url: string,
      service: string,
      icon_url: string,
      color: number,
      channel: TextChannel,
      channels: CChannels,
      db_comments: Model <IDataBaseLastMangaCommentIdModel>
    )
    {
      super (
        discord_client, guilds, translator_url, service,
        icon_url, color, channel, channels, db_comments)
    }
  }

  export class multiple extends core {
    protected async onNewComment (manga: types.multiple.manga_t) {
      const embed = new RichEmbed()
        .setColor(this._color)
        .setAuthor(manga.name, this._icon_url, manga.url)

      type embed_t = { name: string, value: string }

      const to_sent = new Array(new Array <embed_t>())
      let current_array_id = 0
      let current_field_id = 0
      let embed_size = 0
      let fields_size = 0

      for(const page of manga.pages) {
        const current_page = `***[#](${page.url})***`

        const page_fields = page.comments.map(comment => `${current_page} \`\`[${comment.datetime}]\`\` ***[${comment.author.replace(/\*/g, '\◘')}](${comment.author_link})*** : ${comment.message.replace(/\*/g, '\▼').replace(/_{2,}/g, '○')}\n`)
        const current_page_title = `— стр. ${1 + page.page_id} —`
        const embed_default_size = manga.name.length + current_page_title.length

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
        this._channel.send (embed).catch(this.onError.bind (this))
      }
    }

    public async update_comments (
      parser: types.ICommentsParseService)
    {
      this.onUpdateCommentsSelector (parser, this.onNewComment.bind (this))
    }

    constructor (
      discord_client: Client,
      guilds: CGuilds,
      translator_url: string,
      service: string,
      icon_url: string,
      color: number,
      channel: TextChannel,
      channels: CChannels,
      db_comments: Model <IDataBaseLastMangaCommentIdModel>
    )
    {
      super (
        discord_client, guilds, translator_url, service,
        icon_url, color, channel, channels, db_comments)
    }
  }
}