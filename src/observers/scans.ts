import { Document } from 'mongoose'

export namespace types {
  interface IDBLastChapter {
    site: string,
    value: number
  }

  export interface IDBLCModel
  extends
    IDBLastChapter,
    Document {}

  export type page = {
    name: string
    link: string
  }

  export type pages = page[]

  export type mangas = {
    provider: string,
    url: string,
    icon_url: string,
    pages: pages
  } 
}

export * from './scans/lhscan'