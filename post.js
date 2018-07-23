
const _str = '\
	Истории школьниц | Глава 13 | Трудно быть старшеклассницей!\n\
	\n\
	Над главой работали: [id86382408|Sawich], [club149052453|safasf], #hashtagusername1, #hashtagusername2\n\n\
	—\n\
	#mintmanga: https://vk.cc/7JnMjj\n\
	#mangachan: https://vk.cc/7JnM8t\n\
	#onedrive: https://vk.cc/7D2E0R\n\
	—\n\
	Переведено с английского языка.\n\
	—\n\
  #releases@angeldevmanga | #tags'
  

function manga_post(post) {
  if (!post.includes ('#releases@angeldevmanga')) { return }



  console.log(post.split ('\n', 1)[0])
  console.log(`*Над главой работали: ${chapter_workers.join (', ')}*`)
  console.log(post.match (/Переведено с .*?(?:\.|\n|$)/i)[0] || 'Язык перевода не указан')
  console.log(fields)

}

  manga_post(_str)