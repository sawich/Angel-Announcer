const request = require ('request-promise-native')

module.exports = class vk_observer {
  constructor(_bot, _config, _channel) {
    this.bot = _bot
    this.config = _config
    this.channel = _channel

    this._group_user_lj_post = (body, msg = 'Подписочка', color = 0x00bfff) => {
      request (`https://api.vk.com/method/users.get?access_token=${process.env.VK_TOKEN}&user_ids=${body.user_id}&fields=photo_50&lang=0&v=5.73`, { json: true })
      .then (res => {
        this.channel.log.send ({ embeds: res.response.map ((response) => {
          return {
            color,
            description: `${msg} от [${response.first_name} ${response.last_name}](https://vk.com/id${response.id})`,
            author: {
              name: this.bot.user.username,
              icon_url: this.bot.user.avatarURL,
              url: this.config.site
            },
            thumbnail: {
              url: res.response.photo_50
            }
          }
        })})
      }).catch (console.log)
    }
  }

  async manga_post() {
  }

  async group_leave(body) {
    this._group_user_lj_post(body, 'Отписочка', 0xffff00)    
  }

  async group_join(body) {
    this._group_user_lj_post(body)
  }
}