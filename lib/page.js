const fs = require('fs')
const path = require('path')
const got = require('got')

/**
 * exports
 */

exports.fetch = fetch
exports.modify = function (id) {
  const filename = getFileName(id)
  const data = require(filename.json)
  build(filename.html, data)
}

async function fetch(id) {
  const data = await got('http://music.163.com/api/playlist/detail?id=' + id, {
    json: true
  }).then(res => res.body)

  const filename = getFileName(id)
  fs.writeFileSync(filename.json, JSON.stringify(data.result))
  build(filename.html, data.result)
}

function getFileName(id) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const basename = path.join(__dirname, '../data', `pl${id}-${today}`)
  return {
    json: basename + '.json',
    html: basename + '.html'
  }
}

/**
 * 使用网站模板，见网页源码 id="m-wgt-song-list"
 */

function build(filename, data) {
  const rows = data.tracks.map((item, i) => {
    const classNames = getClassNames({
      num: i,
      status: item.status
    })

    const title = getTitle({
      name: item.name,
      id: item.id,
      alias: item.alias
    })

    const artists = getArtists(item.artists)
    const album = getAlbum(item.album)

    return `
    <tr class="${classNames}">
      <td class="left">
        <span class="num">${i + 1}</span>
      </td>
      <td>
        ${title}
      </td>
      <td>
        <span>${dura2time(item.duration)}</span>
      </td>
      <td>
        ${artists}
      </td>
      <td>
        ${album}
      </td>
    </tr>
    `
  })

  fs.writeFileSync(filename, render({
    name: data.name,
    id: data.id,
    total: rows.length,
    tbody: rows.join('\n')
  }))

  function getClassNames(data) {
    const names = []
    if ((data.num % 2) === 0) names.push('even')
    // 不能播放歌曲，需要额外数据来判断
    // if (data.status === 0) {
    //   names.push('js-dis')
    // }
    return names.join(' ')
  }

  function getTitle(data) {
    let name = data.name
    let span = ''

    // 只考虑第一个 alias
    // 没看到多个 alias 的情况
    let alias = data.alias[0]
    if (alias) {
      name = name + ' - ' + alias
      span = `<span title=${alias} class="s-fc8"> - (${alias})</span>`
    }

    return `
    <div class="tt">
    <div class="ttc">
    <span class="txt">
    <a href="http://music.163.com/song?id=${data.id}">
      <b title="${name}">${data.name}</b>
    </a>
    ${span}
    </span>
    </div>
    </div>
    `
  }

  // ms => mm:ss
  function dura2time(n) {
    n = Math.floor(n / 1000)
    const s = n % 60
    const m = (n - s) / 60
    return f(m) + ':' + f(s)

    function f(i) {
      return (i < 10 ? '0' : '') + i
    }
  }

  function getArtists(artists) {
    const names = []
    const str = artists.map(item => {
      names.push(item.name)
      return `<a href="http://music.163.com/artist?id=${item.id}">${item.name}</a>`
    }).join(' / ')

    return `
      <div class="text" title="${names.join('/')}">
        <span class="text">${str}</span>
      </div>`
  }

  function getAlbum(data) {
    return `
    <div class="text">
    <a href="http://music.163.com/album?id=${data.id}" title="${data.name}">${data.name}</a>
    </div>
    `
  }
}

function render(data) {
  const template = fs.readFileSync(path.join(__dirname, 'page.html'), 'utf8')
  return template.replace(/{{([a-z]+)}}/g, (m, p) => data[p])
}
