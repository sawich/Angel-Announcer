import { Document } from 'mongoose'
import { TextChannel } from 'discord.js';

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

//
//   GROUPLE
//

  export namespace events {
    export type update_t = {
      url: string
      name: string
      color: number
      icon_url: string
    }
  }

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
  }

//
//   MANGACHAN
//

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
  }
}

export * from './comments/grouple'
export * from './comments/mangachan'