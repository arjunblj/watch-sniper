'use strict'

require('isomorphic-fetch')

const Bot = require('slackbots')
const LRU = require('lru-cache')
const config = require('./config.json')

const cache = LRU({
  max: 500,
  length: (n, key) => n * 2 + key.length,
  dispose: (key, n) => n.close(),
  maxAge: 1000 * 60 * 60
})

const slackBot = new Bot({
  name: 'Shopify Monitor',
  token: config.slackBot.token
})
slackBot.on('start', () => {
  slackBot.postMessageToChannel(
    config.slackBot.channel,
    'Let the watch sniping begin. \u231A \uD83D\uDD2B',
    config.slackBot.settings
  )
})
slackBot.on('error', () => process.exit())

const WATCH_RECON_URL_BASE = 'http://www.watchrecon.com/?view=json&page_size=50&last_days=7&origin=ioslisting'

const getWatchResults = () => {
  config.keywords.forEach(async keyword => {
    const response = await fetch(
      `${WATCH_RECON_URL_BASE}&query=${encodeURIComponent(keyword)}`
    )
    const data = await response.json()
    data.listings.forEach(listing => {
      if (!cache.get(`${listing.cluster_id}.${listing.listing_id}`)) {
        cache.set(`${listing.cluster_id}.${listing.listing_id}`, listing)
        postToSlack(listing, '#36a64f')
      }
    })
  })
}

const postToSlack = (listing, color) => {
  const img = listing.image_urls.length === 0
    ? config.noImageURL
    : listing.image_urls[0]
  const params = Object.assign({}, config.slackBot.settings, {
    attachments: [
      {
        fallback: `${listing.brand} ${listing.model}`,
        title: listing.subject,
        title_link: listing.url,
        color: color,
        fields: [
          {
            title: 'Model',
            value: `${listing.brand} ${listing.model}`,
            short: 'false'
          },
          { title: 'Source', value: listing.source, short: 'false' },
          { title: 'Price', value: listing.price, short: 'false' }
        ],
        thumb_url: img
      }
    ]
  })
  slackBot.postMessage(config.slackBot.channel, null, params)
}

setInterval(() => getWatchResults(), config.interval)
