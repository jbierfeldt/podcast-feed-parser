require('es6-promise').polyfill()
const fetch = require('isomorphic-fetch')
const parseString = require('xml2js').parseString

function parseXMLFeed (feedText) {
  return new Promise((resolve, reject) => {
        parseString(feedText, (error, result) => {
            if (error) { reject(error) }
            resolve(result)
        })
    })
}

async function fetchFeed (url) {
  const feedResponse = await fetch(url)
  const feedText = await feedResponse.text()
  const feedObject = await parseXMLFeed(feedText)
  return feedObject
}

function getEpisodesFromFeedObject (channel) {
  let episodes = []
  channel.item.forEach( (item) => {
    episodes.push({
      title: getInfo(item.title, true),
      guid: getInfo(item.guid, true, false, getGUID),
      language: getInfo(channel.language, false, true),
      link: getInfo(item.link),
      imageURL: getInfo(item["itunes:image"], false, false, getHREF),
      publicationDate: getInfo(item.pubDate, false, false, cleanDate),
      audioFileURL: getInfo(item.enclosure, true, false, getURL),
      duration: getInfo(item["itunes:duration"], false, false, cleanDuration),
      description: getInfo(item.description),
      subtitle: getInfo(item["itunes:subtitle"]),
      summary: getInfo(item["itunes:summary"]),
      blocked: getInfo(item["itunes:block"], false, false, truthify),
      explicit: getInfo(item["itunes:explicit"], false, false, isExplicit),
      order: getInfo(item["itunes:order"])
    })
  })

  episodes.sort(
    function (a, b) {
      // sorts by order first, if defined, then sorts by date.
      // if multiple episodes were published at the same time,
      // they are then sorted by title
      if (a.order == b.order) {
        if (a.publicationDate.getTime() == b.publicationDate.getTime()) {
          return a.title > b.title ? -1 : 1
        }
        return b.publicationDate > a.publicationDate ? 1 : -1
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

function getInfo (id, isRequired = false, isArray = false, cleanerFunction) {
  if (id) {
    if (isArray) {
      // if value is expected to be an array, returns the value of id
      if (cleanerFunction) {
        return cleanerFunction.call(this, id)
      } else {
        return id
      }
    } else {
      // if value is NOT an array, returns first element in id
      if (cleanerFunction) {
          return cleanerFunction.call(this, id[0])
      } else {
        return id[0]
      }
    }
  } else if (!id && isRequired === true) {
    throw "Value is required."
  } else {
    return undefined
  }
}

function getURL (object) {
  return object['$'].url
}

function getHREF (object) {
  return object['$'].href
}

function getGUID (object) {
  return object._
}

function isExplicit (string) {
  if (['yes', 'explicit', 'true'].indexOf(string.toLowerCase()) >= 0) {
    return true
  } else if (['clean', 'no', 'false'].indexOf(string.toLowerCase()) >= 0) {
    return false
  } else {
    return undefined
  }
}

function isComplete (string) {
  if (string) {
    if (string.toLowerCase === 'yes') {
      return true
    } else {
      return false
    }
  } else {
    return undefined
  }
}

function truthify (string) {
  if (string.toLowerCase == 'yes') {
    return true
  } else {
    return false
  }
}

function cleanOwner (object) {
  return {
    name: object["itunes:name"][0],
    email: object["itunes:email"][0]
  }
}

function cleanDuration (string) {
  // gives duration in seconds
  let times = string.split(':'),
  sum = 0, mul = 1

  while (times.length > 0) {
    sum += mul * parseInt(times.pop())
    mul *= 60
  }

  return sum
}

function cleanCategories (array) {
  // returns categories as an array containing each category/sub-category
  // grouping in lists. If there is a sub-category, it is the second element
  // of an array.
  const categoriesArray = array.map( item => {
    let category = []
    category.push(item['$'].text) // primary category
    if (item['itunes:category']) { // sub-category
      category.push(item['itunes:category'][0]['$'].text)
    }
    return category
  })

  return categoriesArray
}

function cleanDate (string) {
  return new Date(string)
}

async function testCreatePodcastFeedObject (url) {
  const feedResponse = await fetchFeed(url)
  const channel = feedResponse.rss.channel[0]

  try {
    const meta = {
      title: getInfo(channel.title, true),
      guid: getInfo(channel.guid, false, false, getGUID),
      description: getInfo(channel.description, true),
      subtitle: getInfo(channel["itunes:subtitle"]),
      imageURL: getInfo(channel.image[0].url, true),
      lastUpdated: getInfo(channel.lastBuildDate, false, false, cleanDate),
      link: getInfo(channel.link),
      language: getInfo(channel.language, false, true),
      editor: getInfo(channel.managingEditor),
      author: getInfo(channel["itunes:author"]),
      summary: getInfo(channel["itunes:summary"]),
      categories: getInfo(channel["itunes:category"], false, true, cleanCategories),
      owner: getInfo(channel["itunes:owner"], false, false, cleanOwner),
      explicit: getInfo(channel["itunes:explicit"], false, false, isExplicit),
      complete: getInfo(channel["itunes:complete"], false, false, truthify),
      blocked: getInfo(channel["itunes:block"], false, false, truthify)
    }
    const episodes = getEpisodesFromFeedObject(channel)

    return {meta, episodes}
  }
  catch (err) {
    console.log(err)
  }
}

async function createPodcastFeedObject (url) {
  const feedResponse = await fetchFeed(url)
  const channel = feedResponse.rss.channel[0]

  if (channel["itunes:new-feed-url"]) {
    // should break?
    createPodcastFeedObject(channel["itunes:new-feed-url"])
  }

  console.log(channel)

  const meta = {
    title: channel.title,
    description: channel.description,
    imageURL: channel.image[0].url[0],
    link: channel.link,
    language: channel.language,
    editor: channel.managingEditor,
    author: channel["itunes:author"],
    summary: channel["itunes:summary"],
    categories: channel["itunes:category"],
    owner: channel["itunes:owner"],
    explicit: isExplicit(channel["itunes:explicit"][0]),
    complete: isComplete(channel["itunes:complete"])
  }

  return {
    meta: meta,
    episodes: getEpisodesFromFeedObject(channel)
  }
}

async function printPodcast (url) {
  const podcast = await createPodcastFeedObject(url)
  console.log(podcast)
}

async function writePodcast (url) {
  const fs = require('fs');
  const podcast = await testCreatePodcastFeedObject(url)
  fs.writeFile("output.json", JSON.stringify(podcast, undefined, 2), function(err) {
    if(err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
}

// const url = "http://feeds.gimletmedia.com/hearreplyall"
// const url = "http://onmargins.craigmod.com/rss"
// const url = "https://allthingschemical.libsyn.com/rss"
const url = "http://localhost:7000/testrss.xml"
// testCreatePodcastFeedObject(url)
// const url = "http://feeds.gimletmedia.com/hearreplyall"
// printPodcast(url)
writePodcast(url)
