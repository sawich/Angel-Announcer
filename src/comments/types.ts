import { TextChannel } from 'discord.js'
import { JSDOM } from 'jsdom'
import fetch, { RequestInit } from 'node-fetch'
import { IOnError } from '../utils'

export namespace types {
  //
  //   DATABASE
  //
  interface IDBLastComment {
    site: string,
    value: number
  }

  export interface IDBLCModel
  extends
    IDBLastComment,
    Document {}

  export namespace events {
    export type update_t = {
      url: string
      name: string
      color: number
      icon_url: string
      count: number
    }
  }

  export type link_t = {
    name: string,
    link: string
  }

  export type links_t = link_t[]

  export namespace multiple {
    export type comment_t = {
      author_link: string
      author: string
      message: string
      datetime: string
    }

    export type page_t = {
      page_id: number
      url: string
      comments: Array <comment_t>
    }

    export type pages_t = page_t[]

    export type manga_t = {
      name: string
      url: string
      pages: pages_t
    }

    export type service_t = {
      channel: TextChannel
      color: number
      manga: manga_t
      icon: string
    }

    export interface ICommentNotifier {
      (manga: manga_t): Promise <void>
    }
  }

  export namespace single {
    export type comment_t = {
      datetime: string
      author: string
      avatar: string
      message: string
      comment_link: string
      author_link: string
    }

    export type comments_t = comment_t[]

    export type manga_t = {
      name: string
      url: string,
      comments: comments_t
    }

    export type service_t = {
      channel: TextChannel
      color: number
      manga: manga_t
      icon: string
    }

    export interface ICommentNotifier {
      (manga: manga_t): Promise <void>
    }
  }

  export interface ICommentsNotificationService {
    update_translater_page (dom: JSDOM): Promise <string[]>
    update_comments (): Promise <void>
  }

  export interface ICommentsParseService {
    links (dom: JSDOM): Promise <types.links_t>
    translator (dom: JSDOM): Promise <string[]>
    comments (
      _manga_urls: string[],
      _last_comment_id: number,
      _request_options: RequestInit,
      _notifier: single.ICommentNotifier | multiple.ICommentNotifier,
      _error_handler: IOnError
    ): Promise <number[]>
  }
}