import { Emoji } from "discord.js";
import { Model } from "mongoose";
import { JSDOM } from "jsdom";
import { CHtmlDecoder } from "./CHtmlDecoder";
import { IDataBaseLastMangaCommentIdModel } from "./CDataBase";
import axios from "axios";

export type CommentNoticerMangaChanService_t = {
  link: string
  icon: string
  manga_title: string
  manga_url: string
}

export type CommentNoticerMangaChanComment_t = {
  datetime: string
  author: string
  avatar: string
  message: string
  comment_link: string
  author_link: string
}

export type CommentNoticerMangaChanList_t = {
  service: CommentNoticerMangaChanService_t
  comments: Array <CommentNoticerMangaChanComment_t>
}

export class CCommentNoticerMangaChan {
  private _yoba: Emoji
  private _url = 'http://mangachan.me'
  private _favicon = 'https://media.discordapp.net/attachments/473850605031522315/475441620406501387/favicon.png'
  private _db_comments: Model <IDataBaseLastMangaCommentIdModel>

  constructor(yoba: Emoji, db_comments: Model <IDataBaseLastMangaCommentIdModel>) {
    this._yoba = yoba
    this._db_comments = db_comments
  }

  public async update(callback: (list: CommentNoticerMangaChanList_t) => Promise <void>) : Promise <void> {
    const db_model = await this._db_comments.findOne({
      service: 'mangachan'
    }) || await this._db_comments.create({
      service: 'mangachan'
    })

    const translater_page = await axios.get('http://mangachan.me/translation/70489/')
    const translater_page_dom = new JSDOM(translater_page.data)

    const html_decoder = new CHtmlDecoder(translater_page_dom.window.document.createElement('textarea'))

    let last_comment_id = db_model.value
    for (const translater of Array.from(translater_page_dom.window.document.querySelectorAll('.title_link'))) {
      const list: CommentNoticerMangaChanList_t = {
        service: {
          link: this._url,
          icon: this._favicon,
          manga_title: translater.textContent,
          manga_url: `${this._url}${translater.getAttribute("href")}`
        },
        comments: []
      }

      const last_part_url = translater.getAttribute("href").replace('/manga/', '')

      for(let page = 1, done = 0; done != 1; ++page) {
        const manga_page = await axios.get(`${this._url}/manga/page,1,${page},${last_part_url}`)
        const manga_page_dom = new JSDOM(manga_page.data)

        const raw_comments = Array.from(manga_page_dom.window.document.querySelectorAll('[id^=comment-id-]'))
        if(!raw_comments.length) { break }

        for (const comment of raw_comments) {
          const message_id = parseInt(comment.id.match(/comment-id-(\d+)/s)[1])
          if(message_id <= db_model.value) {
            done = 1
            break
          }
          last_comment_id = Math.max(last_comment_id, message_id)

          let message = html_decoder.decode(comment.querySelector('[id^=comm-id-]').innerHTML);
          message = message.replace(/<!--dle_spoiler-->.*?<!--spoiler_text-->(.*?)<!--spoiler_text_end-->.*?<!--\/dle_spoiler-->/g, '```diff\n+ Спойлер\n\n$1```')
          message = message.replace(/<!--QuoteBegin(?:(?:\s+(.*?)\s+)|)-->.*?<!--QuoteEBegin-->(.*?)<!--QuoteEnd-->.*?<!--QuoteEEnd-->/g, '```ini\n[ $1 ]\n\n$2\```')
          message = message.replace(/(<!--smile.*?smile-->)/g, `${this._yoba}`)
          message = message.replace(/<br>/g, '\n')
          message = message.replace(/<b>(.*?)<\/b>/g, '**$1**')
          message = message.replace(/<i>(.*?)<\/i>/g, '*$1*')
          message = message.replace(/<u>(.*?)<\/u>/g, '__$1__')
          message = message.replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')

          const [comment_author, , comment_link] = Array.from(comment.querySelectorAll('.comment_left a'))
          const message_date = comment.querySelector('.comment_left').children[3].textContent.replace(/\((.*?)\)/s, '$1')

          list.comments.push({
            author: comment_author.textContent,
            author_link: comment_author.getAttribute('href'),
            message: message,
            datetime: message_date,
            avatar: `${this._url}${comment.querySelector('div.comment_text table tr td div img').getAttribute('src')}`,
            comment_link: `${manga_page.config.url}${comment_link.getAttribute('href')}`
          })
        }
      }

      callback(list)
    }
    
    db_model.value = last_comment_id
    await db_model.save()
  }
}