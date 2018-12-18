export type grabber_t = {
  name: string,
  path: string,
  description?: string,
  link: string,
  thumb: string,
  title: string
}

export interface IGrabber {
  /**
   * @param {number} — comic id 
   */
  // constructor(comic_id: number);
  /**
   * grab
   * @param {number} — chapter id 
   */
  grab(chapter_id: number) : Promise <grabber_t>;
}
