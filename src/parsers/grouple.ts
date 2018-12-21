import { JSDOM } from 'jsdom'
import fetch, { RequestInit } from 'node-fetch'
import { CHtmlDecoder } from '../CHtmlDecoder'
import * as srv_comments from '../comments'

import { IOnError } from '../utils'

export class grouple
  implements srv_comments.types.ICommentsParseService
{
  public async links (dom: JSDOM): Promise <srv_comments.types.links_t>
  {
    return Array.from(dom.window.document.querySelectorAll('h3 a')).map ((item: HTMLAnchorElement) => {
      return {
        name: item.title,
        link: item.href
      }
    });
  }

  public async translator (dom: JSDOM): Promise <string[]>
  {
    return Array.from(dom.window.document.querySelectorAll('h3 a')).map ((item: HTMLAnchorElement) => {
      return item.href
    });
  }

  public async comments (
    _manga_urls: string[],
    _last_comment_id: number,
    _request_options: RequestInit,
    _notifier: srv_comments.types.multiple.ICommentNotifier,
    _error_handler: IOnError): Promise <number[]>
  {
    const promises = _manga_urls.map (async (manga_url) => {
      const comment_ids: number[] = []

      const main_manga_page = await fetch (manga_url, _request_options)
      const main_manga_page_dom = new JSDOM (await main_manga_page.arrayBuffer ())
      const html_decode = new CHtmlDecoder(main_manga_page_dom.window.document.createElement('textarea'))

      for (const manga_item of Array.from(main_manga_page_dom.window.document.querySelectorAll('.table.table-hover tbody tr td a')).reverse()) {
        const manga_page = await fetch (`http://${_request_options.headers['Host']}${manga_item}?mtr=1`, _request_options)

        const manga_page_dom = new JSDOM(await manga_page.arrayBuffer ())
        const pages: srv_comments.types.multiple.pages_t = []
        const parser_comment = new RegExp(/<a href="(.*?)">(.*?)(?: <i.*><\/i>|)<\/a>: <span>(.*?) <span.*?claimTwitt\((.*?),.*?<span>([\d]{2}\/[\d]{2}\/[\d]{2})/)
        const parser_page_id = new RegExp(/cm_(-?[0-9]\d*(\.\d+)?)/)
        for(const comments of Array.from(manga_page_dom.window.document.querySelectorAll('[class*=cm_]'))) {
          const page_id = parseInt(comments.className.match(parser_page_id)[1])
          const current: srv_comments.types.multiple.page_t = {
            url: `${manga_page.url}/#page=${page_id}`,
            page_id,
            comments: []
          }

          for(const comment of Array.from(comments.children)) {
            const [ , author_link, author, message, message_id, datetime ] = html_decode.decode(comment.innerHTML).match(parser_comment)

            const messageid = parseInt(message_id)
            if(messageid <= _last_comment_id) {
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
          _notifier ({
            name: (manga_page_dom.window.document.querySelector ('.manga-link') as HTMLAnchorElement).textContent,
            url: main_manga_page.url,
            pages: pages.sort ((a, b) => {
              return a.page_id - b.page_id;
            })
          })
        }
      }

      return comment_ids
    })

    return [].concat (...(await Promise.all (promises.map (p => p.catch (e => {
      _error_handler (e)
      return []
    })))))
  }
}