
import fetch, { RequestInit } from 'node-fetch'
import { Model } from 'mongoose'
import { JSDOM } from 'jsdom'
import { types } from "./../scans"

import * as events from 'events'

export class lhscan {
  constructor (/*db_scans: Model <types.IDBLCModel>*/) {
    //this.m_db = db_scans
    this.m_emiter = new events.EventEmitter
    this.m_links = []
  }

  public async update_event_subscribe (func: Function) {
    this.m_emiter.addListener ('update', func.bind (this))
  }

  public async update_event_unsubscribe (func: Function) {
    this.m_emiter.removeListener ('update', func.bind (this))
  }

  public async link_add (link: string) {
    this.m_links = [ ...this.m_links, link ]
  }

  public async links_add (links: string[]) {
    this.m_links = [ ...this.m_links, ...links ]
  }

  public async update () {
    const pack: types.mangas = { 
      provider: 'LHScan',
      url: 'https://lhscan.net',
      icon_url: 'https://lhscan.net/favicon.ico',
      pages: []
    }

    await Promise.all (this.m_links.map (async (link) => {
      const main_manga_page = await fetch (link, this._request_options)
      let resoinse = await main_manga_page.text ()
      const main_manga_page_dom = new JSDOM (resoinse)
    
      const tbody = main_manga_page_dom
        .window
        .document
        .querySelector ('.table.table-hover tbody') as HTMLTableSectionElement


      const pages: types.pages = []
      
      for (let q = 0; q != tbody.children.length; ++q) {
        const anchor = tbody
          .children.item (q) // tr
          .children.item (0) // td
          .children.item (0) as HTMLAnchorElement // a

          pages.push ({ 
            name: anchor.title,
            link: `${pack.url}/${anchor.href}`
          })
      }

      pack.pages = [ ...pack.pages, ...pages.reverse () ]
    }))

    this.m_emiter.emit ('update', pack)
  }
  
  // [ PRIVATE ] methods
  
  // [ PRIVATE ] variables

  private m_db: Model <types.IDBLCModel>
  private m_links: string[]
  private m_emiter: events.EventEmitter

  private _request_options: RequestInit = {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'ru,en-US,en',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
      'Host': 'lhscan.net',
      'Referer': 'http://lhscan.net/',
      'TE': 'Trailers',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:63.0) Gecko/20100101 Firefox/63.0'
    }
  } 
}