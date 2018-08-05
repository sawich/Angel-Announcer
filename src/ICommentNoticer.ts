export type CommentNoticerService_t = {
  link: string
  icon: string
  manga_title: string
  manga_url: string
}

export type CommentNoticerComment_t = {
  datetime: string
  author: string
  avatar: string
  message: string
  comment_link: string
  author_link: string
}

export type CommentNoticerList_t = {
  service: CommentNoticerService_t
  comments: Array <CommentNoticerComment_t>
}

export interface ICommentNoticer {
  update(callback: (list: CommentNoticerList_t) => Promise <void>) : Promise <void>
}