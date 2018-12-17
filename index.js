require('es6-promise').polyfill()
const fetch = require('isomorphic-fetch')
const parseString = require('xml2js').parseString

const ERRORS = exports.ERRORS = {
  'parsingError' : new Error("Parsing error."),
  'requiredError' : new Error("One or more required values are missing from feed."),
  'fetchingError' : new Error("Fetching error.")
}

/*
=======================
=== DEFAULT OPTIONS ===
=======================
*/

const DEFAULT = exports.DEFAULT = {
  fields: {
    meta: ['title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
            'language', 'editor', 'author', 'summary', 'categories', 'owner',
            'explicit', 'complete', 'blocked'],
    episodes: ['title', 'description', 'subtitle', 'imageURL', 'pubDate',
            'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
            'explicit', 'order']
  },
  required: {},
  uncleaned: {}
}

/*
=====================
=== GET FUNCTIONS ===
=====================
*/

const GET = exports.GET = {
  imageURL: function (node) {

    if (node.image) {
      return node.image[0].url[0]
    }

    if (node["itunes:image"]) {
      return node["itunes:image"][0]['$'].href
    }

    return undefined
  },

  subtitle: function (node) {
    return node['itunes:subtitle']
  },

  lastUpdated: function (node) {
    return node.lastBuildDate
  },

  editor: function (node) {
    return node.managingEditor
  },

  author: function (node) {
    return node['itunes:author']
  },

  summary: function (node) {
    return node['itunes:summary']
  },

  owner: function (node) {
    return node['itunes:owner']
  },

  explicit: function (node) {
    return node['itunes:explicit']
  },

  complete: function (node) {
    return node['itunes:complete']
  },

  blocked: function (node) {
    return node['itunes:block']
  },

  order: function (node) {
    return node['itunes:order']
  },

  guid: function (node) {
    return node.guid[0]._
  },

  duration: function (node) {
    return node['itunes:duration']
  },

  categories: function (node) {
    // returns categories as an array containing each category/sub-category
    // grouping in lists. If there is a sub-category, it is the second element
    // of an array.

    const categoriesArray = node["itunes:category"].map( item => {
      let category = []
      category.push(item['$'].text) // primary category
      if (item['itunes:category']) { // sub-category
        category.push(item['itunes:category'][0]['$'].text)
      }
      return category
    })

    return categoriesArray
  }
}

const getDefault = exports.getDefault = function (node, field) {
  return (node[field]) ? node[field] : undefined
}


/*
=======================
=== CLEAN FUNCTIONS ===
=======================
*/

const CLEAN = exports.CLEAN = {

  enclosure: function (object) {
    return {
      length: object[0]["$"].length,
      type: object[0]["$"].type,
      url: object[0]["$"].url
    }
  },

  duration: function (string) {
    // gives duration in seconds
    let times = string[0].split(':'),
    sum = 0, mul = 1

    while (times.length > 0) {
      sum += mul * parseInt(times.pop())
      mul *= 60
    }

    return sum
  },

  owner: function (object) {
    return {
      name: object[0]["itunes:name"][0],
      email: object[0]["itunes:email"][0]
    }
  },

  lastUpdated: function (string) {
    return new Date(string).toISOString()
  },

  pubDate: function (string) {
    return new Date(string).toISOString()
  },

  complete: function (string) {
    if (string[0].toLowerCase == 'yes') {
      return true
    } else {
      return false
    }
  },

  blocked: function (string) {
    if (string.toLowerCase == 'yes') {
      return true
    } else {
      return false
    }
  },

  explicit: function (string) {
    if (['yes', 'explicit', 'true'].indexOf(string[0].toLowerCase()) >= 0) {
      return true
    } else if (['clean', 'no', 'false'].indexOf(string[0].toLowerCase()) >= 0) {
      return false
    } else {
      return undefined
    }
  },

  imageURL: function (string) {
    return string
  }

}

const cleanDefault = exports.cleanDefault = function (node) {
  // return first item of array
  if (node !== undefined && node[0]!== undefined) {
    return node[0]
  } else {
    return node
  }
}

/*
=================================
=== OBJECT CREATION FUNCTIONS ===
=================================
*/

const getInfo = exports.getInfo = function (node, field, required, uncleaned) {
  // gets relevant info from podcast feed using options:
  // @field - string - the desired field name, corresponding with GET and clean
  //     functions
  // @required - boolean - if field is set to be required and is undefined,
  //     throw and error
  // @uncleaned - boolean - if field should not be cleaned before returning

  var info;

  // if field has a GET function, use that
  // if not, get default value
  info = (GET[field]) ? GET[field].call(this, node) : getDefault(node,field)

  // if info is undefined and field is required, throw require error
  if (required && info === undefined) { throw ERRORS.requiredError }

  // if field is not marked as uncleaned, clean it using CLEAN functions
  if (!uncleaned && info !== undefined) {
    info = (CLEAN[field]) ? CLEAN[field].call(this, info) : cleanDefault(info)
  }

  return info
}

function createMetaObjectFromFeed (channel, options) {

  const meta = {}

  options.fields.meta.forEach( (field) => {
    const obj = {}
    var required = false
    var uncleaned = false

    if (options.required && options.required.meta) {
      var required = (options.required.meta.indexOf(field) >= 0)
    }

    if (options.uncleaned && options.uncleaned.meta) {
      var uncleaned = (options.uncleaned.meta.indexOf(field) >= 0)
    }

    obj[field] = getInfo(channel, field, required, uncleaned)

    Object.assign(meta, obj)
  })

  return meta
}

// function builds episode objects from parsed podcast feed
function createEpisodesObjectFromFeed (channel, options) {
  let episodes = []

  channel.item.forEach( (item) => {
    const episode = {}

    options.fields.episodes.forEach( (field) => {
      const obj = {}
      var required = false
      var uncleaned = false

      if (options.required && options.required.episodes) {
        var required = (options.required.episodes.indexOf(field) >= 0)
      }

      if (options.uncleaned && options.uncleaned.episodes) {
        var uncleaned = (options.uncleaned.episodes.indexOf(field) >= 0)
      }

      obj[field] = getInfo(item, field, required, uncleaned)

      Object.assign(episode, obj)
    })

    episodes.push(episode)
  })

  episodes.sort(
    function (a, b) {
      // sorts by order first, if defined, then sorts by date.
      // if multiple episodes were published at the same time,
      // they are then sorted by title
      if (a.order == b.order) {
        if (a.pubDate == b.pubDate) {
          return a.title > b.title ? -1 : 1
        }
        return b.pubDate > a.pubDate ? 1 : -1
      }

      if (a.order && !b.order) {
        return 1
      }

      if (b.order && !a.order) {
        return -1
      }

      return a.order > b.order ? -1 : 1
    }
  )

  return episodes
}

/*
======================
=== FEED FUNCTIONS ===
======================
*/

function promiseParseXMLFeed (feedText) {
  return new Promise((resolve, reject) => {
        parseString(feedText, (error, result) => {
            if (error) { reject(ERRORS.parsingError) }
            resolve(result)
        })
    })
}

function parseXMLFeed (feedText) {
    let feed = {}
    parseString(feedText, (error, result) => {
      if (error) {
        throw ERRORS.parsingError
      }
      Object.assign(feed, result)
      return result
    })
    return (feed)
}

async function fetchFeed (url) {
  try {
    const feedResponse = await fetch(url)
    const feedText = await feedResponse.text()
    const feedObject = await promiseParseXMLFeed(feedText)
    return feedObject
  } catch (err) {
    throw ERRORS.fetchingError
  }
}

/*
=======================
=== FINAL FUNCTIONS ===
=======================
*/

const getPodcastFromURL = exports.getPodcastFromURL = async function (url, params) {
  try {
    let options = (typeof params === 'undefined') ? DEFAULT : params

    const feedResponse = await fetchFeed(url)
    const channel = feedResponse.rss.channel[0]

    if (channel["itunes:new-feed-url"]) {
      getPodcastFromURL(channel["itunes:new-feed-url"])
    }

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    // throw err
    throw err
  }
}

const getPodcastFromFeed = exports.getPodcastFromFeed = function (feed, params) {
  try {
    let options = (typeof params === 'undefined') ? DEFAULT : params

    const feedObject = parseXMLFeed(feed)
    const channel = feedObject.rss.channel[0]

    if (channel["itunes:new-feed-url"]) {
      getPodcastFromURL(channel["itunes:new-feed-url"])
    }

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    throw err
  }
}
