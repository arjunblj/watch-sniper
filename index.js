'use strict'

require('isomorphic-fetch')

const config = require('./config.json')

const WATCH_RECON_URL_BASE = 'http://www.watchrecon.com/?view=json&page_size=50&last_days=7&origin=ioslisting'

function getWatchResults () {
  config.keywords.forEach(async keyword => {
    const response = await fetch(
      `${WATCH_RECON_URL_BASE}&query=${encodeURIComponent(keyword)}`
    )
    const data = await response.json()
    data.listings.map(listing => console.log(listing))
  })
}

getWatchResults()
