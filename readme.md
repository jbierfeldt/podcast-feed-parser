[![npm version](https://badge.fury.io/js/podcast-feed-parser.svg)](https://badge.fury.io/js/podcast-feed-parser)
[![Build Status](https://travis-ci.com/jbierfeldt/podcast-feed-parser.svg?branch=master)](https://travis-ci.com/jbierfeldt/podcast-feed-parser)

[![NPM](https://nodei.co/npm/podcast-feed-parser.png)](https://nodei.co/npm/podcast-feed-parser/)

# Table of Contents

   * [podcast-feed-parser](#podcast-feed-parser)
      * [Overview](#overview)
      * [Quickstart](#quickstart)
      * [Default](#default)
      * [Configuration](#configuration)
         * [Fields](#fields)
            * [Specifying particular fields](#specifying-particular-fields)
            * [Extending default fields](#extending-default-fields)
         * [Required](#required)
         * [Uncleaned](#uncleaned)
      * [Asynchronously Fetching Remote Feeds](#asynchronously-fetching-remote-feeds)
      * [Errors](#errors)

# podcast-feed-parser

A highly customizable package for fetching and parsing podcast feeds into simple and manageable JavaScript objects. For use with node and in the browser.

## Overview
By default, `podcast-feed-parser` will parse a podcast's xml feed and return an object with the following properties. `meta` contains all of the information pertinent to the podcast show itself, and `episodes` is list of episode objects which contain the information pertinent to each individual episode of the podcast.

```js
{
    meta: {
      title: 'My podcast',
      description: 'A podcast about whatever',
      // ...
    },
    episodes: [
      {
        title: 'My Episode 1',
        description: 'Episode 1',
        pubDate: '2018-11-29T10:30:00.000Z',
        // ...
      }, {
        title: 'My Episode 2',
        description: 'Episode 2',
        pubDate: '2018-11-28T10:30:00.000Z',
        // ...
      }
    ]
  }
}
```

## Quickstart

`podcast-feed-parser` has two main functions: `getPodcastFromFeed` and `getPodcastFromURL`.

For fetching remote feeds from urls, use `getPodcastFromURL`:

```js
const podcastFeedParser = require("podcast-feed-parser")

// for fetching remote feeds, use getPodcastFromURL.
// Note that function must be async
async function printPodcastTitle (url) {
	const podcast = await podcastFeedParser.getPodcastFromURL(url)
	console.log(podcast.meta.title)
}

printPodcastTitle('http://feeds.gimletmedia.com/hearreplyall')
// "Reply All"

```

If you already have the podcast feed xml, use `getPodcastFromFeed`:

```js
const podcastFeedParser = require("podcast-feed-parser")
const fs = require('fs')

// if you already have the feed xml, you can parse
// synchronously with getPodcastFromFeed
const podcastFeed = fs.readFileSync('path/to/podcast-feed.xml', 'utf8')
const podcast = podcastFeedParser.getPodcastFromFeed(podcastFeed)

console.log(podcast.meta.title)
// "My Podcast"

podcast.episodes.forEach( (episode) => {
	console.log(episode.title)
})
// "My Episode 1"
// "My Episode 2"
```

## Default

By default, `podcast-feed-parser` will parse a feed for the following default fields, based on [this standard](https://github.com/simplepie/simplepie-ng/wiki/Spec:-iTunes-Podcast-RSS). If a field is not found in a feed, it will quietly return `undefined`.

```js
{
    meta: {
        title: '',
        description: '',
        subtitle: '',
        imageURL: '',
        lastUpdated: '',
        link: '',
        language: '',
        editor: '',
        author: '',
        summary: '',
        categories: [],
        owner: {
            name: '',
            email: ''
        },
        explicit: true,
        complete: true,
        blocked: true
    },
    episodes: [
      {
        title: '',
        description: '',
        imageURL: '',
        pubDate: '',
        link: '',
        language: '',
        enclosure: {
            length: '0',
            type: '',
            url: ''
        },
        duration: 0,
        summary: '',
        blocked: true,
        explicit: true,
        order: 1
      }
  ]
}
```

## Configuration

You can customize `podcast-feed-parser` by passing an optional `options` object to either of parsing functions, `getPodcastFromFeed` and `getPodcastFromURL`. The options object consists of three components: `fields`, `required`, and `uncleaned`.

```js
const options = {
  // specifies the fields to be parsed from the podcast feed
  fields: {
    meta: [],
    episodes: []
  },
  // specifies the fields which must be present for the function to return without
  // an error
  required: {
    meta: [],
    episodes: []
  },
  // specifies which fields should not have any of the cleaning functions applied
  uncleaned: {
    meta: [],
    episodes: []
  }
}
```

### Fields

If no options object is passed to the parsing function, or if no fields are specified, then the fields listed in the [Default](#default) section are applied.

#### Specifying particular fields

If you specify particular fields for either `meta` or `episodes`, the final podcast object will only consist of those fields.

```js
const options = {
  fields : {
    'meta': ['title', 'description', 'webMaster'],
    'episodes': ['title', 'pubDate', 'timeline']
  }
}

const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)

console.log(podcast)
// { meta:
//    { title: 'All Things Chemical',
//      description: 'All Things Chemical is a podcast...',
//      webMaster: 'Jackson Bierfeldt (jbierfeldt@gmail.com)'
//    },
//   episodes:
//     [ { title: 'Confidential Business Information under TSCA',
//        pubDate: '2018-11-29T10:30:00.000Z',
//        timeline: 'http://timelinenotation.com/pages/documentation/notation.php' }
//     ] }
// }
```

#### Extending default fields

If you wish to use the default fields listed in the [Default](#default) section, but to also parse an additional field, you can include `'default'` in the list of desired fields, along with the names of the additional fields you wish to parse.

```js
const options = {
  fields : {
    'meta': ['default', 'webMaster'],
    'episodes': ['default', 'timeline']
  }
}

const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)

console.log(podcast)
// { meta:
//    { title: 'All Things Chemical',
//      description: 'All Things Chemical is a podcast...',
//      subtitle: 'A Podcast...',
//      ...
//      [all default meta fields]
//      ...
//      webMaster: 'Jackson Bierfeldt (jbierfeldt@gmail.com)'
//    },
//   episodes:
//     [ { title: 'Confidential Business Information under TSCA',
//        ...
//        [all default episode fields]
//        ...
//        timeline: 'http://timelinenotation.com/pages/documentation/notation.php' }
//     ] }
// }
```

### Required

By default, `podcast-feed-parser` will quietly return an `undefined` value if it tries to parse a field in a podcast feed that does not exist. If you wish for the function to halt and throw [requiredError](#errors) when a particular field is missing, you can specify those fields in the `required` options object.

```js
const options = {
  fields : {
    'meta': ['title', 'description'],
    'episodes': ['title', 'pubDate']
  },
  required: {
    'meta': ['title']
  }
}

const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)

// If podcast feed does not have a title attribute, parser will throw a requiredError

// If podcast feed does not have a description attribute, parsing will continue
// and the resulting podcast object will have an undefined attribute for meta.description
```

### Uncleaned
By default, `podcast-feed-parser` will clean and standardize the data for several fields. For example, the podcast object returned by `podcast-feed-parser` will always return durations as integer numbers of seconds, not as formatted strings. This is for convenience when working with many different unstandardized podcast feeds from different sources.

A full list of the fields which are cleaned and the functions used to clean them can be found in the `CLEAN FUNCTIONS` section of `index.js`.

If you would like the data in the podcast object to resemble exactly that of the podcast feed,
you can list fields which should remain uncleaned in the `uncleaned` options object. These fields will have no cleaning applied to them after parsing.

```js
// sampleFeed
<xml>
  <itunes:duration>39:58</itunes:duration>
</xml>

// -------------

// default behavior with no options supplied
const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
console.log(podcast.episodes[0].duration)
// 2398

// -------------

const options = {
  uncleaned: {
    'episodes': ['duration']
  }
}

const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
console.log(podcast.episodes[0].duration)
// ['39:58']

```


## Asynchronously Fetching Remote Feeds

`podcast-feed-parser` can also fetch and parse remote feeds in both the browser and server environment thanks to `isomorphic-fetch`. Simply call `getPodcastFromURL(url, options)`. Functions which fetch remote feeds must be asynchronous and utilize async/await.

```js
const podcastFeedParser = require("podcast-feed-parser")

async function getNumberOfEpisodes (url) {
	const podcast = await podcastFeedParser.getPodcastFromURL(url)
	console.log(podcast.meta.title, podcast.episodes.length)
}

getNumberOfEpisodes('http://feeds.gimletmedia.com/hearreplyall')
// "Reply All"
// 148

```

## Errors

`podcast-feed-parser` has a variety of custom errors. These are exposed under `exports.ERRORS` and are as follows:

```js
exports.ERRORS = {
  'parsingError' : new Error("Parsing error."),
  'requiredError' : new Error("One or more required values are missing from feed."),
  'fetchingError' : new Error("Fetching error."),
  'optionsError' : new Error("Invalid options.")
}
```
