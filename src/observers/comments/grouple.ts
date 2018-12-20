import fetch, { RequestInit } from 'node-fetch'
import { Model } from 'mongoose'
import { IDataBaseLastMangaCommentIdModel } from './../../CDataBase'
import { JSDOM } from 'jsdom'
import { CHtmlDecoder } from './../../CHtmlDecoder'
import { types } from './../comments'
import { TextChannel } from 'discord.js'

import * as events from 'events'

export class grouple {
  public async update_translater_page () { 
    try {
      const translater_page = await fetch (`http://${this._service}/list/person/angeldev`, this._request_options)
      const translater_page_dom = new JSDOM(await translater_page.text ())

      this._manga_links = Array.from(translater_page_dom.window.document.querySelectorAll('h3 a')).map ((item: Element) => {
        return `http://${this._service}${item.getAttribute("href")}`
      });
      
      const service: types.events.update_t = {
        color: this._color,
        icon_url: this._favicon,
        name: this._service,
        url: `http://${this._service}`
      }

      this.m_emiter.emit ('translator_update', service)

      setTimeout(this.update_translater_page.bind (this), 3600000); // 1 hour
    } catch (error) {
      this.m_emiter.emit ('error', error.stack)
      
      setTimeout(this.update_translater_page.bind (this), 10000); // 10 sec
    }
  }

  public async update () {    
    let comment_ids = []

    try {      
      const db_model = await this._db_comments.findOne({
        service: this._service
      }) || await this._db_comments.create({
        service: this._service,
        value: 0
      })

      await Promise.all (this._manga_links.map (async (manga_link) => {
        const main_manga_page = await fetch (manga_link, this._request_options)
        const main_manga_page_dom = new JSDOM (await main_manga_page.text ())
        const html_decode = new CHtmlDecoder(main_manga_page_dom.window.document.createElement('textarea'))

        for (const manga_item of Array.from(main_manga_page_dom.window.document.querySelectorAll('.table.table-hover tbody tr td a')).reverse()) {
          const manga_page = await fetch (`http://${this._service}${manga_item}?mtr=1`, this._request_options)
          
          const manga_page_dom = new JSDOM(await manga_page.text ())
          const pages: types.multiple.pages_t = []
          const parser_comment = new RegExp(/<a href="(.*?)">(.*?)(?: <i.*><\/i>|)<\/a>: <span>(.*?) <span.*?claimTwitt\((.*?),.*?<span>([\d]{2}\/[\d]{2}\/[\d]{2})/)
          const parser_page_id = new RegExp(/cm_(-?[0-9]\d*(\.\d+)?)/)
          for(const comments of Array.from(manga_page_dom.window.document.querySelectorAll('[class*=cm_]'))) {
            const page_id = parseInt(comments.className.match(parser_page_id)[1])
            const current: types.multiple.page_t = {
              url: `${manga_page.url}/#page=${page_id}`,
              page_id,
              comments: []
            }
  
            for(const comment of Array.from(comments.children)) {            
              const [ , author_link, author, message, message_id, datetime ] = html_decode.decode(comment.innerHTML).match(parser_comment)
                
              const messageid = parseInt(message_id)
              if(messageid <= db_model.value) {
                break
              }
              comment_ids.push (messageid)
  
              current.comments.push({
                author_link, author, message, datetime
              })
            }
  
            if(current.comments.length) {
              current.comments = current.comments.reverse ()
              pages.push(current)
            }
          }
  
          if(0 != pages.length) {            
            this.m_emiter.emit ('update', {
              channel: this._channel,
              color: this._color,
              manga: {
                name: `${manga_item.textContent.trim().replace(/\r?\n|\r/g,'').replace(/ {2,}/g, ' (')})`,
                url: main_manga_page.url,
                pages: pages.sort ((a, b) => {
                  return a.page_id - b.page_id;
                })
              },
              icon: this._favicon
            })
          }    
        }
      }))

      db_model.value = Math.max (db_model.value, ...comment_ids)
      await db_model.save()
    } catch (error) {
      this.m_emiter.emit ('error', error.stack)
    }
  }

  public subscribe_error (callback: Function) {
    this.m_emiter.addListener ('error', callback.bind (this))
  }

  public subscribe_translator_update (callback: Function) {
    this.m_emiter.addListener ('translator_update', callback.bind (this))
  }
  
  constructor(
    color: number,
    channel: TextChannel,
    service: string,
    icon: string,
    db_comments: Model <IDataBaseLastMangaCommentIdModel>)
  {
    this._channel = channel
    this._color = color
    this._favicon = icon
    this._service = service
    this._db_comments = db_comments
    this._request_options = {
      method: 'GET',
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

    this.m_emiter = new events.EventEmitter
  }

  private m_emiter: events.EventEmitter

  private _color: number
  private _channel: TextChannel

  private _favicon: string
  private _service: string
  private _db_comments: Model <IDataBaseLastMangaCommentIdModel>
  private _request_options: RequestInit
  private _manga_links: string[]
}