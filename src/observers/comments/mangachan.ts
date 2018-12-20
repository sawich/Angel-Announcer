import fetch from 'node-fetch'
import { Model } from 'mongoose'
import { IDataBaseLastMangaCommentIdModel } from './../../CDataBase'
import { JSDOM } from 'jsdom'
import { CHtmlDecoder } from './../../CHtmlDecoder'
import { types } from './../comments'
import { Emoji, TextChannel } from 'discord.js'

import * as events from 'events'

export class mangachan {
  public async update_translater_page () {
    try {
      const translater_page = await fetch('http://mangachan.me/translation/70489/')
      const translater_page_dom = new JSDOM(await translater_page.text ())

      this._manga_links = Array.from(translater_page_dom.window.document.querySelectorAll('.title_link')).map ((item: Element) => {
        return `http://mangachan.me${item.getAttribute("href")}`
      });
      
      const service: types.events.update_t = {
        color: this._color,
        icon_url: 'https://media.discordapp.net/attachments/473850605031522315/475441620406501387/favicon.png',
        name: 'mangachan.me',
        url: 'http://mangachan.me',
        count: this._manga_links.length
      }

      this.m_emiter.emit ('translator_update', service)

      console.log('mangachan.me')
      console.log(this._manga_links)
      setTimeout(this.update_translater_page.bind (this), 3600000); // 1 hour
    } catch (error) {
      this.m_emiter.emit ('error', error)

      setTimeout(this.update_translater_page.bind (this), 10000); // 10 sec
    }
  }

  public async update() {
    let comment_ids = []

    try {      
      const db_model = await this._db_comments.findOne({
        service: 'mangachan.me'
      }) || await this._db_comments.create({
        service: 'mangachan.me',
        value: 0
      })
      await Promise.all (this._manga_links.map (async (manga_link) => {
        const html_decoder = new CHtmlDecoder(new JSDOM().window.document.createElement('textarea'))

        const last_part_url = manga_link.replace('http://mangachan.me/manga/', '')
        let manga_page = await fetch(`http://mangachan.me/manga/page,1,1,${last_part_url}`)
        let manga_page_dom = new JSDOM(await manga_page.text ())

        const comments: types.single.comments_t = []

        for(let page = 2, done = 0; done != 1; ++page) {
          const raw_comments = Array.from(manga_page_dom.window.document.querySelectorAll('[id^=comment-id-]'))
          if(!raw_comments.length) { break }

          for (const comment of raw_comments) {
            const message_id = parseInt(comment.id.match(/comment-id-(\d+)/s)[1])
            if(message_id <= db_model.value) {
              done = 1
              break
            }

            comment_ids.push (message_id)

            let message = html_decoder.decode(comment.querySelector('[id^=comm-id-]').innerHTML)
              .replace(/<!--dle_spoiler-->.*?<!--spoiler_text-->(.*?)<!--spoiler_text_end-->.*?<!--\/dle_spoiler-->/g, '```diff\n+ Спойлер\n\n$1```')
              .replace(/<!--QuoteBegin(?:(?:\s+(.*?)\s+)|)-->.*?<!--QuoteEBegin-->(.*?)<!--QuoteEnd-->.*?<!--QuoteEEnd-->/g, '```ini\n[ $1 ]\n\n$2\```')
              .replace(/(<!--smile.*?smile-->)/g, `${this._yoba}`)
              .replace(/<br>/g, '\n')
              .replace(/<b>(.*?)<\/b>/g, '**$1**')
              .replace(/<i>(.*?)<\/i>/g, '*$1*')
              .replace(/<u>(.*?)<\/u>/g, '__$1__')
              .replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')

            const [comment_author, , comment_link] = Array.from(comment.querySelectorAll('.comment_left a'))
            const message_date = comment.querySelector('.comment_left').children[3].textContent.replace(/\((.*?)\)/s, '$1')

            comments.push({
              author: comment_author.textContent,
              author_link: comment_author.getAttribute('href'),
              message: message,
              datetime: message_date,
              avatar: `http://mangachan.me${comment.querySelector('div.comment_text table tr td div img').getAttribute('src')}`,
              comment_link: `http://mangachan.me${comment_link.getAttribute('href')}`
            })
          }

          manga_page = await fetch(`http://mangachan.me/manga/page,1,${page},${last_part_url}`)
          manga_page_dom = new JSDOM(await manga_page.text ())
        }

        if (0 != comments.length) {
          this.m_emiter.emit ('update', {
            channel: this._channel,
            color: this._color,
            manga: {
              name: manga_page_dom.window.document.querySelector ('.title_top_a').textContent,
              url: manga_link,
              comments
            },
            icon: 'https://media.discordapp.net/attachments/473850605031522315/475441620406501387/favicon.png'
          })
        }
      }))

      db_model.value = Math.max (db_model.value, ...comment_ids)
      await db_model.save()
    } catch (error) {
      this.m_emiter.emit ('error', error)
    }
  }

  public subscribe_error (callback: Function) {
    this.m_emiter.addListener ('error', callback.bind (this))
  }

  public subscribe_translator_update (callback: Function) {
    this.m_emiter.addListener ('translator_update', callback.bind (this))
  }

  public subscribe_update (callback: Function) {
    this.m_emiter.addListener ('update', callback.bind (this))
  }

  constructor(
    color: number,
    channel: TextChannel,
    yoba: Emoji,
    db_comments: Model <IDataBaseLastMangaCommentIdModel>)
  {
    this._channel = channel
    this._color = color
    this._yoba = yoba
    this._db_comments = db_comments

    this.m_emiter = new events.EventEmitter
  }

  private m_emiter: events.EventEmitter

  private _color: number
  private _channel: TextChannel

  private _yoba: Emoji
  private _db_comments: Model <IDataBaseLastMangaCommentIdModel>
  private _manga_links: string[]
}