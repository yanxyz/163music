#!/usr/bin/env node

const yargs = require('yargs-parser')
const page = require('./lib/page')
const config = require('./config')

/**
 * cli options
 */

const argv = yargs(process.argv.slice(2), {
  alias: {
    help: ['h']
  },
  boolean: ['help', 'm']
})

if (argv.help) {
  showHelp()
  process.exit()
}

const id = handleId(argv._[0])
if (argv.m) {
  page.modify(id)
} else {
  page.fetch(id)
}

/**
 * functions
 */

function showHelp() {
  const cmd = 'node cli.js'
  console.log(`
${cmd} [playlist_id]
fetch playlist and build page

${cmd} [playlist_id] -m
rebuild page
`)
}

function handleId(id = config.playlist_id) {
  id = parseInt(id)
  if (id < 1) {
    console.error('invalid playlist id')
    process.exit()
  }
  return id
}
