const fs = require('fs')
const path = require('path')
const got = require('got')
const encrypt = require('./encrypt')

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
  const data = await got.post('http://music.163.com/weapi/v3/playlist/detail', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3218.0 Safari/537.36',
      Referer: 'http://music.163.com',
    },
    form: true,
    body: encrypt(JSON.stringify({
      id,
      offset: 0,
      total: true,
      limit: 1000,
      n: 1000,
      csrf_token: ''
    }))
  }).then(res => {
    // console.log(res.headers)
    return res.body
  })

  const filename = getFileName(id)
  fs.writeFileSync(filename.json, data)
  build(filename.html, JSON.parse(data))
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
  const rows = data.playlist.tracks.map((item, i) => {
    const classNames = getClassNames({
      index: i,
      privilege: data.privileges[i]
    })

    const title = getTitle({
      name: item.name,
      id: item.id,
      alias: item.alia
    })

    const artists = getArtists(item.ar)
    const album = getAlbum(item.al)

    return `
    <tr class="${classNames}">
      <td class="left">
        <span class="num">${i + 1}</span>
      </td>
      <td>
        ${title}
      </td>
      <td>
        <span>${dura2time(item.dt)}</span>
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
    name: data.playlist.name,
    id: data.playlist.id,
    total: rows.length,
    tbody: rows.join('\n')
  }))

  function getClassNames(data) {
    const names = []
    if ((data.index % 2) === 0) names.push('even')
    // 不能播放的歌曲
    // 参见 core.js l6f.pj1x
    const pr = data.privilege
    if ((pr.st != null && pr.st < 0) ||
      (pr.pl === 0 && pr.dl === 0)
    ) {
      names.push('js-dis')
    }
    return names.join(' ')
  }

  function getTitle(data) {
    let name = data.name
    let span = ''

    // 只考虑第一个 alias
    // 目前没遇到多个 alias 的情况
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
