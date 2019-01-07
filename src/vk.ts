import fetch, { Response } from 'node-fetch'
import config from './config/config'
import { error } from './utils'
import { Client } from 'discord.js'
import { CChannels } from './CChannels'
import { CGuilds } from './CGuilds'

type pvoid_t = Promise <void>

// 7d4011e2e112aff70800095ea11a9312f1d6b280e056d498bd4152f552f88250ef0852f39a8df65f112f9

namespace vk_objects {
  export type post_t = {
    // Идентификатор записи
    id: number
    
    // Идентификатор владельца стены,
    // на которой размещена запись
    owner_id: number
    
    // Идентификатор автора записи
    // (от чьего имени опубликована запись)
    from_id: number
    
    // Идентификатор администратора, который опубликовал запись
    // (возвращается только для сообществ при запросе
    //  с ключом доступа администратора)
    created_by : number
    
    // Время публикации записи в формате unixtime
    date: number

    // Текст записи
    text: string
    
    // Идентификатор владельца записи,
    // в ответ на которую была оставлена текущая
    reply_owner_id: number
    
    // Идентификатор записи, в ответ на которую была оставлена текущая
    reply_post_id: number
    
    // 1, если запись была создана с опцией «Только для друзей»
    friends_only: number
    
    // Информация о комментариях к записи, объект с полями
    comments: {
      // количество комментариев
      count: number
      
      // [0, 1]
      // информация о том, может ли текущий пользователь
      // комментировать запись (1 — может, 0 — не может)
      can_post: number
      
      // [0, 1]
      // Информация о том, могут ли сообщества комментировать запись
      groups_can_post : number
      
      // Может ли текущий пользователь закрыть комментарии к записи
      can_close: boolean
      
      // Может ли текущий пользователь открыть комментарии к записи
      can_open: boolean      
    }
    
    // Информация о лайках к записи, объект с полями
    likes: {
      // Число пользователей, которым понравилась запись
      count : number
      
      // Наличие отметки «Мне нравится» от текущего пользователя
      // (1 — есть, 0 — нет)
      user_likes: number
      
      // Информация о том, может ли текущий пользователь
      // поставить отметку «Мне нравится» (1 — может, 0 — не может)
      can_like: number
      
      // Информация о том, может ли текущий пользователь
      // сделать репост записи (1 — может, 0 — не может)
      can_publish: number
    }

    // Информация о репостах записи («Рассказать друзьям»),
    // объект с полями
    reposts: {
      // Число пользователей, скопировавших запись
      count: number

      // Наличие репоста от текущего пользователя (1 — есть, 0 — нет)
      user_reposted: number      
    }

    // Информация о просмотрах записи. Объект с единственным полем
    views: {
      // Число просмотров записи
      count: number
    }

    // Тип записи, может принимать следующие значения:
    //  • post
    //  • copy
    //  • reply
    //  • postpone
    //  • suggest
    post_type: string

    // Информация о способе размещения записи
    post_source: {
      // Тип источника. Возможные значения      
      type: string
      
      // Название платформы, если оно доступно.
      // Возможные значения:
      //  • android
      //  • iphone
      //  • wphone
      platform: string
      
      // Тип действия (только для type = vk или widget).
      // Возможные значения:
      //  • profile_activity — изменение статуса под именем 
      //    пользователя (для type = vk)
      //  • profile_photo — изменение профильной фотографии 
      //    пользователя (для type = vk)
      //  • comments — виджет комментариев (для type = widget)
      //  • like — виджет «Мне нравится» (для type = widget)
      //  • poll — виджет опросов (для type = widget)
      data: string
      
      // URL ресурса, с которого была опубликована запись
      url : string
    }

    // Медиавложения записи (фотографии, ссылки и т.п.)
    attachments: {
      type: string
    }[]

    // Информация о местоположении , содержит поля
    geo: {
      // Тип места
      type: string

      // Координаты места
      coordinates : string

      // Описание места (если оно добавлено).
      place: {
        // Идентификатор места
        id: number

        // Название места.
        title: string

        // Географическая широта, заданная в градусах (от -90 до 90).
        latitude: number
        
        // Географическая широта, заданная в градусах (от -90 до 90)
        longitude: number
        
        // Дата создания места в Unixtime
        created: number
        
        // Иконка места, URL изображения
        icon: string
        
        // Число отметок в этом месте
        checkins: number
        
        // Дата обновления места в Unixtime
        updated: number
        
        // Тип места
        type: number
        
        // Идентификатор страны
        country: number
        
        // Идентификатор города
        city: number
        
        // Адрес места
        address: string
      }
    }

    // Идентификатор автора, если запись была опубликована от имени
    // сообщества и подписана пользователем
    signer_id: number

    // Массив, содержащий историю репостов для записи.
    // Возвращается только в том случае, если запись является
    // репостом. Каждый из объектов массива, в свою очередь,
    // является объектом-записью стандартного формата
    copy_history: post_t[]

    // Информация о том, может ли текущий пользователь закрепить
    // запись (1 — может, 0 — не может)
    can_pin: number

    // Информация о том, может ли текущий пользователь удалить запись
    // (1 — может, 0 — не может)
    can_delete: number

    // Информация о том, может ли текущий пользователь редактировать
    // запись (1 — может, 0 — не может)
    can_edit: number

    // Информация о том, что запись закреплена
    is_pinned: number

    // Информация о том, содержит ли запись отметку "реклама"
    // (1 — да, 0 — нет).
    marked_as_ads: number

    // true, если объект добавлен в закладки у текущего пользователя
    is_favorite: boolean
  }
}

namespace long_pool_objects {
  //
  // Записи на стене
  //

  // Запись на стене
  // Для записей, размещенных от имени пользователя, from_id > 0
  export type wall_post_new = vk_objects.post_t & {
    // идентификатор отложенной записи
    postponed_id: number
  }

  // Репост записи из сообщества
  // Для записей, размещенных от имени пользователя, from_id > 0
  export type wall_repost = vk_objects.post_t & {
    // идентификатор отложенной записи
    postponed_id: number
  }

  //
  //   Пользователи
  //

  // Добавление участника или заявки на вступление в сообщество
  export type group_leave = {
    // Идентификатор пользователя
    user_id : number
    // Значение, указывающее, был пользователь удален или вышел 
    // самостоятельно [0, 1]
    self: number
  }

  // Добавление пользователя в чёрный список	
  export type group_join = {
    // Идентификатор пользователя
    user_id: number
    // Указывает, как именно был добавлен участник
    // Возможные значения:
    //  • join — пользователь вступил в группу или мероприятие (подписался на публичную страницу)
    //  • unsure — для мероприятий: пользователь выбрал вариант «Возможно, пойду»
    //  • accepted — пользователь принял приглашение в группу или на мероприятие
    //  • approved — заявка на вступление в группу/мероприятие была одобрена руководителем сообщества
    //  • request — пользователь подал заявку на вступление в сообщество
    join_type: string
  }

  // Добавление пользователя в чёрный список	
  export type user_block = {
    // Идентификатор администратора, который внёс пользователя в чёрный список
    admin_id: number
    // Идентификатор пользователя
    user_id: number
    // Дата разблокировки
    unblock_date: number
    // Причина блокировки. Возможные значения:
    //  • 0 — другое (по умолчанию)
    //  • 1 — спам
    //  • 2 — оскорбление участников
    //  • 3 — нецензурные выражения
    //  • 4 — сообщения не по теме
    reason: number
    // Комментарий администратора к блокировке.
    comment: string
  }

  // Удаление пользователя из чёрного списка  
  export type user_unblock = {
    // Идентификатор администратора, который убрал пользователя из чёрного списка
    admin_id: number
    // Идентификатор пользователя
    user_id: number
    // 1, если истёк срок блокировки [0, 1]
    by_end_date: number
  }
}

type error_t = {
  error: {
    error_code: number
    error_msg: string
    request_params: {
      key: string
      value: string
    }[]
  }
}

type long_pool_server_t = {
  response: {
    key: string
    server: string
    ts: number
  }
}

type long_pool_t = {
  failed?: number
  ts?: number
  updates?: {    
    type?: string
    object?: long_pool_objects.group_leave | long_pool_objects.group_join | long_pool_objects.user_block | long_pool_objects.user_unblock | long_pool_objects.wall_post_new | long_pool_objects.wall_repost
    group_id?: string
  }[]
}

export class vk extends error {
  constructor (
    discord_client: Client,
    channels: CChannels,
    guilds: CGuilds
  ) {
    super (discord_client, guilds, channels)
  }

  public async launch (): pvoid_t {
    await this.generate_link ()
    await fetch (`${this._url}&${this._ts}`, this.update.bind (this))
  }

  private async generate_link (): pvoid_t {
    const poolserver = await fetch (`https://api.vk.com/method/groups.getLongPollServer?access_token=${process.env.VK_TOKEN_TEST}&v=5.92&group_id=${config.vk.group_id_test}`)
    const server: long_pool_server_t | error_t = await poolserver.json ()
    if (server.hasOwnProperty ('error')) {
      const error = new Error
      error.name = 'vk loooooooooong pool'
      error.message = (server as error_t).error.error_msg
      
      const fields = [ ...(server as error_t)
        .error.request_params.map (e => ({
          name: e.key,
          value: e.value
        })) ]

      this.onError (error, fields)
      process.exit (1)
    }

    this._ts = (server as long_pool_server_t).response.ts
    this._url = `${(server as long_pool_server_t).response.server}?act=a_check&key=${(server as long_pool_server_t).response.key}&wait=25`
  }

  private async update (data: Response): pvoid_t {
    const response: long_pool_t | error_t = await data.json ()

    if (response.hasOwnProperty ('failed')) {  
      switch ((response as long_pool_t).failed) {
        // история событий устарела или была частично утеряна,
        // приложение может получать события далее,
        // используя новое значение ts из ответа
        case 1:
          this._ts = (response as long_pool_t).ts
        break
  
        case 2:
          // need short generator
          // without ts
          await this.generate_link ()
        break
  
        case 3:
          await this.generate_link ()
        break      
      }
    } else if (response.hasOwnProperty ('error')) {
      if (response.hasOwnProperty ('error')) {
        const error = new Error
        error.name = 'vk loooooooooong pool'
        error.message = (response as error_t).error.error_msg
        
        const fields = [ ...(response as error_t)
          .error.request_params.map (e => ({
            name: e.key,
            value: e.value
          })) ]
  
        this.onError (error, fields)
        process.exit (1)
      }
    } else {
      for (const action of (response as long_pool_t).updates) {
        switch (action.type) {
          case 'wall_post_new': {
          }
        }
        this._channels.test.send (action.type)
        console.log(action.type)        
      }
    }
    
    fetch (`${this._url}&${this._ts}`, this.update.bind (this))
  }

  _ts: number
  _url: string
}