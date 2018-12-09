

import fetch, { RequestInit } from 'node-fetch'
import { Model } from 'mongoose';
import { IDataBaseLastMangaCommentIdModel } from './CDataBase';
import { JSDOM } from 'jsdom';
import { CHtmlDecoder } from './CHtmlDecoder';

export type CommentNoticerReadMangaComment_t = {
  author_link: string
  author: string
  message: string
  datetime: string
}

export type CommentNoticerReadMangaPage_t = {
  page_id: number
  url: string
  comments: Array <CommentNoticerReadMangaComment_t>
}

export type CommentNoticerReadManga_t = {
  name: string
  url: string
  icon: string
  pages: Array <CommentNoticerReadMangaPage_t>
}

export class CCommentNoticerReadManga {

  private _favicon = 'https://images-ext-2.discordapp.net/external/hJe0w-3ID-KwQvUA9lvoVW6DJznQkQ6Ht1_9uYN8Tvw/http/res.readmanga.me/static/apple-touch-icon-a401a05b79c2dad93553ebc3523ad5fe.png'
  private _db_comments: Model <IDataBaseLastMangaCommentIdModel>

  private _request_options = {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'ru,en-US;q=0.7,en',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
      'Host': 'readmanga.me',
      'Referer': 'http://readmanga.me/',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:63.0) Gecko/20100101 Firefox/63.0'
    }
  } 

  private _manga_links: string[]

  public async update_translater_page () { 
    try {
      const translater_page = await fetch ('http://readmanga.me/list/person/angeldev', this._request_options)
      const translater_page_dom = new JSDOM(await translater_page.text ())

      this._manga_links = Array.from(translater_page_dom.window.document.querySelectorAll('h3 a')).map ((item: Element) => {
        return `http://readmanga.me${item.getAttribute("href")}`
      });

      console.log ('readmanga')
      console.log(this._manga_links)

      setTimeout(this.update_translater_page.bind (this), 3600000); // 1 hour
    } catch (error) {
      console.error (`RM update manga list [${error}]`)
      
      setTimeout(this.update_translater_page.bind (this), 10000); // 10 sec
    }
  }
  
  constructor(db_comments: Model <IDataBaseLastMangaCommentIdModel>) {
    this._db_comments = db_comments
  }

  public async update (callback?: (data: CommentNoticerReadManga_t) => Promise <void>) : Promise <void> {
    const db_model = await this._db_comments.findOne({
      service: 'readmanga'
    }) || await this._db_comments.create({
      service: 'readmanga',
      value: 0
    })    
    
    let comment_ids = []

    await Promise.all (this._manga_links.map (async (manga_link) => {
      try {
        const main_manga_page = await fetch (manga_link, this._request_options)
        const main_manga_page_dom = new JSDOM (await main_manga_page.text ())
        const html_decode = new CHtmlDecoder(main_manga_page_dom.window.document.createElement('textarea'))

        for (const manga_item of Array.from(main_manga_page_dom.window.document.querySelectorAll('.table.table-hover tbody tr td a')).reverse()) {
          // console.log (`[${manga_item}][ ${manga_item.textContent.trim().replace(/\r?\n|\r/g,'').replace(/ {2,}/g, ' (')}) ]`)

          try {
            const manga_page = await fetch (`http://readmanga.me${manga_item}?mtr=1`, this._request_options)
            
            const manga_page_dom = new JSDOM(await manga_page.text ())
            const data: CommentNoticerReadManga_t = {
              icon: this._favicon,
              name: `${manga_item.textContent.trim().replace(/\r?\n|\r/g,'').replace(/ {2,}/g, ' (')})`,
              url: main_manga_page.url,
              pages: []
            }
      
            const parser_comment = new RegExp(/<a href="(.*?)">(.*?)(?: <i.*><\/i>|)<\/a>: <span>(.*?) <span.*?claimTwitt\((.*?),.*?<span>([\d]{2}\/[\d]{2}\/[\d]{2})/)
            const parser_page_id = new RegExp(/cm_(-?[0-9]\d*(\.\d+)?)/)
            for(const comments of Array.from(manga_page_dom.window.document.querySelectorAll('[class*=cm_]'))) {
              //console.log(`${comments.className} (${manga_page.config.url})`)
              const page_id = parseInt(comments.className.match(parser_page_id)[1])
              const current: CommentNoticerReadMangaPage_t = {
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
                data.pages.push(current)
              }
            }
    
            if(data.pages.length) {
              callback(data)
            }            
          } catch (error) {
            console.error (`manga page [${error}]`)
          }
        }
      } catch (error) {
        console.error (`main manga page [${error}]`)
      }
    }))

    db_model.value = Math.max (db_model.value, ...comment_ids)
    await db_model.save()
  }
}