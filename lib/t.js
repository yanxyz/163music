#!/usr/bin/env node

/**
 * 将单首歌曲从歌单中提取出来
 */

const fs = require('fs')
const path = require('path')
const config = require('../config') // config.songs 指定歌曲

run()

function run() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = path.join(__dirname, '../data', `pl${config.playlist_id}-${today}.json`)
  const data = require(filename)

  const list = data.tracks
    .filter(x => config.songs.includes(x.name))
    .map(x => {
      x.hMusic = null
      x.mMusic = null
      x.lMusic = null
      x.bMusic = null
      return x
    })

  list.forEach(x => {
    const filename = path.join(__dirname, '../data', `_${x.name}.json`)
    fs.writeFileSync(filename, JSON.stringify(x, null, 2))
  })
}
