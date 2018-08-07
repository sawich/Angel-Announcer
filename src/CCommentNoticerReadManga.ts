

import axios from 'axios'
import { throttleAdapterEnhancer } from 'axios-extensions';
import { Model } from 'mongoose';
import { IDataBaseLastMangaCommentIdModel } from './CDataBase';
import { JSDOM } from 'jsdom';
import { CHtmlDecoder } from './CHtmlDecoder';

const readmanga = axios.create({
  baseURL: 'http://readmanga.me',
  headers: { 'Cache-Control': 'no-cache' },
  adapter: throttleAdapterEnhancer(axios.defaults.adapter, { threshold: 1 * 10000 })
})

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
  
  constructor(db_comments: Model <IDataBaseLastMangaCommentIdModel>) {
    this._db_comments = db_comments
  }

  public async update(callback?: (data: CommentNoticerReadManga_t) => Promise <void>) : Promise <void> {
    const db_model = await this._db_comments.findOne({
      service: 'readmanga'
    }) || await this._db_comments.create({
      service: 'readmanga'
    })    
    let last_comment_id = db_model.value


    const translater_page = await readmanga.get('http://readmanga.me/list/person/angeldev')
    const translater_page_dom = new JSDOM(translater_page.data)

    const html_decode = new CHtmlDecoder(translater_page_dom.window.document.createElement('textarea'))
  
    for (const translater of Array.from(translater_page_dom.window.document.querySelectorAll('h3 a'))) {
      //console.log(`[ ${translater.getAttribute("title")} ]`)
  
      const list_of_managa_page = await readmanga.get(`http://readmanga.me${translater.getAttribute("href")}`)
      const list_of_managa_page_dom = new JSDOM(list_of_managa_page.data)
      for (const manga_item of Array.from(list_of_managa_page_dom.window.document.querySelectorAll('.table.table-hover tbody tr td a')).reverse()) {
        //console.log(`[${manga_item}][ ${manga_item.textContent.trim().replace(/\r?\n|\r/g,'').replace(/ {2,}/g, ' (')}) ]`)
  
        const manga_page = await readmanga.get(`http://readmanga.me${manga_item}?mtr=1`)
  
        const manga_page_dom = new JSDOM(manga_page.data)
        const data: CommentNoticerReadManga_t = {
          icon: this._favicon,
          name: `${manga_item.textContent.trim().replace(/\r?\n|\r/g,'').replace(/ {2,}/g, ' (')})`,
          url: list_of_managa_page.config.url,
          pages: []
        }
  
        const parser_comment = new RegExp(/<a href="(.*?)">(.*?)(?: <i.*><\/i>|)<\/a>: <span>(.*?) <span.*?claimTwitt\((.*?),.*?<span>([\d]{2}\/[\d]{2}\/[\d]{2})/)
        const parser_page_id = new RegExp(/cm_(-?[0-9]\d*(\.\d+)?)/)
        for(const comments of Array.from(manga_page_dom.window.document.querySelectorAll('[class*=cm_]'))) {
          //console.log(`${comments.className} (${manga_page.config.url})`)
          const page_id = parseInt(comments.className.match(parser_page_id)[1])
          const current: CommentNoticerReadMangaPage_t = {
            url: `${manga_page.config.url}/#page=${page_id}`,
            page_id,
            comments: []
          }
          for(const comment of Array.from(comments.children)) {            
            const [ , author_link, author, message, message_id, datetime ] = html_decode.decode(comment.innerHTML).match(parser_comment)
              
            const messageid = parseInt(message_id)
            if(messageid <= db_model.value) {
              break
            }
            last_comment_id = Math.max(last_comment_id, messageid)

            current.comments.push({
              author_link, author, message, datetime
            })
          }
          data.pages.push(current)
        }

        if(data.pages.length) {
          await callback(data)
        }
      }
    }

    db_model.value = last_comment_id
    await db_model.save()
  }
}