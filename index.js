const fetch = require('isomorphic-fetch')
const parseString = require('xml2js').parseString

const ERRORS = exports.ERRORS = {
  'parsingError' : new Error("Parsing error."),
  'requiredError' : new Error("One or more required values are missing from feed."),
  'fetchingError' : new Error("Fetching error."),
  'optionsError' : new Error("Invalid options.")
}

/*
============================================
=== DEFAULT OPTIONS and OPTIONS BUILDING ===
============================================
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
  required: {
    meta: [],
    episodes: []
  },
  uncleaned: {
    meta: [],
    episodes: []
  }
}

// from https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
function mergeDedupe(arr)
{
  return [...new Set([].concat(...arr))];
}

const buildOptions = exports.buildOptions = function (params) {
  try {

    // default options
    // tried to accomplish this by referencing the DEFAULT object,
    // but ran into problems with mutation when doing Object.assign(options[key], params[key])
    let options = {
      fields: {
        meta: ['title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
                'language', 'editor', 'author', 'summary', 'categories', 'owner',
                'explicit', 'complete', 'blocked'],
        episodes: ['title', 'description', 'subtitle', 'imageURL', 'pubDate',
                'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
                'explicit', 'order']
      },
      required: {
        meta: [],
        episodes: []
      },
      uncleaned: {
        meta: [],
        episodes: []
      }
    }

    // if no options parameters given, use default
    if (typeof params === 'undefined') {
      options = DEFAULT
      return options
    }

    // merge empty options and given options
    Object.keys(options).forEach( key => {
      if (params[key] !== undefined) {
        Object.assign(options[key], params[key])
      }
    })

    // if 'default' given in parameters, merge default options with given custom options
    //  and dedupe
    if (options.fields.meta.includes('default')) {
      options.fields.meta = mergeDedupe([DEFAULT.fields.meta, params.fields.meta])
      options.fields.meta.splice(options.fields.meta.indexOf('default'), 1)
    }

    if (options.fields.episodes.includes('default')) {
      options.fields.episodes = mergeDedupe([DEFAULT.fields.episodes, params.fields.episodes])
      options.fields.episodes.splice(options.fields.episodes.indexOf('default'), 1)
    }

    return options

  } catch (err) {
    throw ERRORS.optionsError
  }
}

/*
=====================
=== GET FUNCTIONS ===
=====================
*/

const GET = exports.GET = {
  imageURL: function (node) {
    if (node["itunes:image"]) {
      return node["itunes:image"][0]['$'].href
    }

    if (node.image) {
      return node.image[0].url[0]
    }

    return undefined
  },

  subtitle: function (node) {
    return getValueFromNode(node, 'itunes:subtitle');
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
    return getValueFromNode(node, 'itunes:summary');
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
    return node.guid && node.guid[0]
  },

  duration: function (node) {
    return getValueFromNode(node, 'itunes:duration');
  },

  keywords: function (node) {
    return getValueFromNode(node, 'itunes:keywords');
  },

  categories: function (node) {
    // returns categories as an array containing each category/sub-category
    // grouping in lists. If there is a sub-category, it is the second element
    // of an array.

    let categoriesArray = [];
    if(node["itunes:category"] && node["itunes:category"].length > 0){
      categoriesArray = node["itunes:category"].map( item => {
        let category = []
        category.push(item['$'].text) // primary category
        if (item['itunes:category']) { // sub-category
          category.push(item['itunes:category'][0]['$'].text)
        }
        return category
      })
    }

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
    // Check if 'string' is actually an array or object due to unexpected data structure.
    if (Array.isArray(string)) {
      string = string[0]; // Adjust according to the actual structure you're receiving.
    }

    let times = string.split(':'),
    sum = 0, mul = 1;
  
    while (times.length > 0) {
      sum += mul * parseInt(times.pop(), 10);
      mul *= 60;
    }
  
    return sum;
  },

  owner: function (object) {
    let ownerObject = {}

    if (object[0].hasOwnProperty("itunes:name")) {
      ownerObject.name = object[0]["itunes:name"][0]
    }

    if (object[0].hasOwnProperty("itunes:email")) {
      ownerObject.email = object[0]["itunes:email"][0]
    }

    return ownerObject
  },

  lastUpdated: function (string) {
    return new Date(string).toISOString()
  },

  pubDate: function (string) {
    return new Date(string).toISOString()
  },

  guid: function (string) {
    if (typeof string === 'object' && '_' in string) {
      return string._
    } else {
      return string
    }
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
    if (['yes', 'explicit', 'true'].includes(string[0].toLowerCase())) {
      return true
    } else if (['clean', 'no', 'false'].includes(string[0].toLowerCase())) {
      return false
    } else {
      return undefined
    }
  },

  imageURL: function (string) {
    return string
  },
  keywords: function (keywords) {
    // Check if 'string' is actually a string and contains commas.
    if (typeof keywords === 'string' && keywords.includes(',')) {
      return keywords.split(',').map(keyword => keyword.trim());
    }
    if (typeof keywords === 'object' && keywords[0].includes(',')) {
      return keywords[0].split(',').map(keyword => keyword.trim());
    }
    // If it's already an array or doesn't contain commas, return it as is.
    return keywords;
  },
}

const getValueFromNode = (node, key) => {

  if(Array.isArray(node[key]) && node[key][0] && typeof node[key][0] === "string"){
    return node[key];
  }
  if (node[key]) {
    if (Array.isArray(node[key]) && node[key].length > 0) {
      // Check if the first element is an object with only the '$' key (attributes), 
      // which should be skipped.
      if (typeof node[key][0] === 'object' && node[key][0].hasOwnProperty('$') && Object.keys(node[key][0]).length === 1) {
        // If it's the only element in the array, return an empty string.
        return '';
      } else if (typeof node[key][0] === 'object' && '_' in node[key][0]) {
        // If the value is an object with '_', return the '_' value.
        return node[key][0]['_'];
      }
      // If it's just an array, return the first element.
      return node[key][0];
    }
    // If it's neither an array nor an object with '_', return the value directly.
    return node[key];
  }
  // If the key doesn't exist, return undefined.
  return undefined;
};

const cleanDefault = exports.cleanDefault = function (node) {
  // return first item of array
  if (node !== undefined && node[0]!== undefined && Array.isArray(node)) {
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

const getInfo = exports.getInfo = function (node, field, uncleaned) {
  // gets relevant info from podcast feed using options:
  // @field - string - the desired field name, corresponding with GET and clean
  //     functions
  // @uncleaned - boolean - if field should not be cleaned before returning

  var info;

  // if field has a GET function, use that
  // if not, get default value
  info = (GET[field]) ? GET[field].call(this, node) : getDefault(node,field)

  // if field is not marked as uncleaned, clean it using CLEAN functions
  if (!uncleaned && info !== undefined) {
    info = (CLEAN[field]) ? CLEAN[field].call(this, info) : cleanDefault(info)
  } else {
  }

  return info
}

function createMetaObjectFromFeed (channel, options) {

  const meta = {}

  options.fields.meta.forEach( (field) => {
    const obj = {}
    var uncleaned = false

    if (options.uncleaned && options.uncleaned.meta) {
      var uncleaned = (options.uncleaned.meta.includes(field))
    }

    obj[field] = getInfo(channel, field, uncleaned)

    Object.assign(meta, obj)
  })

  if (options.required && options.required.meta) {
    options.required.meta.forEach( (field) => {
      if (!Object.keys(meta).includes(field)) {
        throw ERRORS.requiredError
      }
    })
  }

  return meta
}

// function builds episode objects from parsed podcast feed
function createEpisodesObjectFromFeed (channel, options) {
  let episodes = []

  channel.item.forEach( (item) => {
    const episode = {}

    options.fields.episodes.forEach( (field) => {
      const obj = {}
      var uncleaned = false

      if (options.uncleaned && options.uncleaned.episodes) {
        var uncleaned = (options.uncleaned.episodes.includes(field))
      }

      obj[field] = getInfo(item, field, uncleaned)

      Object.assign(episode, obj)
    })

    if (options.required && options.required.episodes) {
      options.required.episodes.forEach( (field) => {
        if (!Object.keys(episode).includes(field)) {
          throw ERRORS.requiredError
        }
      })
    }

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
    const options = buildOptions(params)

    const feedResponse = await fetchFeed(url)

    const channel = feedResponse.rss.channel[0]

    if (channel["itunes:new-feed-url"]) {
      const newURL = channel["itunes:new-feed-url"][0];
      if (newURL != url) {
      	return await getPodcastFromURL(channel["itunes:new-feed-url"][0], params)
      }
    }

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    throw err
  }
}

const getPodcastFromFeed = exports.getPodcastFromFeed = function (feed, params) {
  try {
    const options = buildOptions(params)

    const feedObject = parseXMLFeed(feed)
    const channel = feedObject.rss.channel[0]

    if (channel["itunes:new-feed-url"]) {
      console.warn("\nWarning: Feed includes \<itunes:new-feed-url\> element, which indicates that the feed being parsed may be outdated.\n")
    }

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    throw err
  }
}
