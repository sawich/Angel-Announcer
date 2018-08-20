import { IGrabber, grabber_t } from "./IGrabber";
import axios from "axios";
import { JSDOM } from "jsdom";
import { v4 } from "uuid";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { create } from "archiver";

type dajiaochongmanhua_t = {
  error: number,
  data: {
    lock_type: number,
    data: Array<{
      cid: number,
      catid: number,
      name: string,
      total: number,
      time: string,
      page: number,
      price: number,
      thumb: string,
      buy_lock: boolean,
      lock_type: number
    }>
    id: number,
    view_type: number,
    userid: number,
    cdn: string
  },
}

type image_list_item_t = {
  imgid: number,
  image: string,
  url: string
};

type image_list_t = Array <image_list_item_t>;

/// lily (1378)
export class CGrabberDajiaochongmanhua implements IGrabber {
  private _comic_id: number

  constructor(comic_id: number = 1378) {
    this._comic_id = comic_id
  }

  public async grab(chapter_id: number) : Promise <grabber_t> {
    const need_ch  : number = (chapter_id - 1)
    const per_page : number = 12
    const page     : number = 1 + (need_ch / per_page)
    const item     : number = (need_ch % per_page)
    
    const thumb_promise = (await axios.get(`https://www.dajiaochongmanhua.com/comic/${this._comic_id}`)).data
    const thumb_dom = new JSDOM(thumb_promise)

    const response = (await axios.get <dajiaochongmanhua_t> (`https://www.dajiaochongmanhua.com/chaptshow?bookid=${this._comic_id}&start=${page}&view_type=0&_=1533297522353`)).data
    const manhwa_page = (await axios.get(`https://www.dajiaochongmanhua.com/chapter/${response.data.data[item].cid}`))
    const manhwa_page_dom = new JSDOM(manhwa_page.data)
    
    const IMAGE_LIST_URL_regexp = new RegExp(/var IMAGE_LIST_URL = (.*?);/)
    const script = Array.from(manhwa_page_dom.window.document.querySelectorAll('script')).find(value => IMAGE_LIST_URL_regexp.test(value.textContent))
    if(!script) { return }

    const parsed = JSON.parse(script.textContent.match(IMAGE_LIST_URL_regexp)[1]) as image_list_t

    const path = `${v4()}.zip`
    const output = createWriteStream(path);
    const archive = create('zip', { zlib: { level: 9 } } )
    const wait = new Promise((write_complete) => output.on('close', () => {
      write_complete()
    }))

    archive.pipe(output)

    await Promise.all(
      parsed.map(async (data, index) => {  
        const image = await axios.get <Readable> (data.url, { responseType: 'stream' })
        archive.append(image.data, { name: `${index + 1}.jpg` })
      })
    )

    archive.finalize()

    await wait
    return { 
      thumb: thumb_dom.window.document.querySelector('.book-thumb').getAttribute('src'),
      link: manhwa_page.config.url,
      descripion: 'В этой маньхуе есть экстра главы, из-за чего на сайте нумерация сибита!', 
      name: response.data.data[item].name,
      title: thumb_dom.window.document.querySelector('.book-name').textContent,
      path
    }
  }
}