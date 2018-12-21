import { JSDOM } from 'jsdom'
import fetch, { RequestInit } from 'node-fetch'
import { CHtmlDecoder } from '../CHtmlDecoder'
import * as srv_comments from '../comments'
import { Emoji } from 'discord.js'

import { IOnError } from '../utils'

export class mangachan
  implements srv_comments.types.ICommentsParseService
{
  public async links (dom: JSDOM): Promise <srv_comments.types.links_t>
  {
    return Array.from(dom.window.document.querySelectorAll('.title_link')).map ((item: HTMLAnchorElement) => {
      return {
        name: item.title,
        link: item.href
      }
    });
  }
  
  public async translator (dom: JSDOM): Promise <string[]> 
  {
    return Array.from(dom.window.document.querySelectorAll('.title_link')).map ((item: HTMLAnchorElement) => {
      return item.href
    });
  }

  public async comments (
    _manga_urls: string[],
    _last_comment_id: number,
    _request_options: RequestInit,
    _notifier: srv_comments.types.single.ICommentNotifier,
    _error_handler: IOnError): Promise <number[]>
  {
    const promises = _manga_urls.map (async (manga_url) => {
      const comment_ids: number[] = []

      const html_decoder = new CHtmlDecoder(new JSDOM().window.document.createElement('textarea'))

      const last_part_url = manga_url.replace('http://mangachan.me/manga/', '')
      let manga_page = await fetch(`http://mangachan.me/manga/page,1,1,${last_part_url}`, _request_options)
      let manga_page_dom = new JSDOM(await manga_page.arrayBuffer ())

      const comments_array: srv_comments.types.single.comments_t = []

      for(let page = 2, done = 0; done != 1; ++page) {
        const raw_comments = Array.from(manga_page_dom.window.document.querySelectorAll('[id^=comment-id-]'))
        if(!raw_comments.length) { break }

        for (const comment of raw_comments) {
          const message_id = parseInt(comment.id.match(/comment-id-(\d+)/s)[1])
          if(message_id <= _last_comment_id) {
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

          const [ comment_author, , comment_link ] = Array.from(comment.querySelectorAll('.comment_left a'))
          const message_date = comment.querySelector('.comment_left').children[3].textContent.replace(/\((.*?)\)/s, '$1')

          comments_array.push({
            author: comment_author.textContent,
            author_link: comment_author.getAttribute('href'),
            message: message,
            datetime: message_date,
            avatar: `http://mangachan.me${comment.querySelector('div.comment_text table tr td div img').getAttribute('src')}`,
            comment_link: `http://mangachan.me${comment_link.getAttribute('href')}`
          })
        }

        manga_page = await fetch(`http://mangachan.me/manga/page,1,${page},${last_part_url}`, _request_options)
        manga_page_dom = new JSDOM(await manga_page.arrayBuffer ())
      }

      if (0 != comments_array.length) {
        _notifier ({
          name: manga_page_dom.window.document.querySelector ('.title_top_a').textContent,
          url: manga_url,
          comments: comments_array
        })
      }
      
      return comment_ids
    })

    return [].concat (...(await Promise.all (promises.map (p => p.catch (e => {
      _error_handler (e)
      return []
    })))))
  }

  constructor (yoba: Emoji) {
    this._yoba = yoba
  }

  private _yoba: Emoji
}