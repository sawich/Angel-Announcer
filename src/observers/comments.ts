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

    export type manga_t = {
      name: string
      url: string
      pages: Array <page_t>
    }

    export type service = {
      channel: TextChannel
      color: number
      mangas: manga_t[]
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

    export type manga_t = {
      name: string
      url: string,
      comments: Array <comment_t>
    }

    export type service_t = {
      channel: TextChannel
      color: number
      mangas: manga_t[]
      icon: string
    }
  }
}

export * from './comments/grouple'
export * from './comments/mangachan'