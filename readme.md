Based on following spec: https://github.com/simplepie/simplepie-ng/wiki/Spec:-iTunes-Podcast-RSS

Podcast Object with default fields:
```
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
        explicit: true / false,
        complete: true / false,
        blocked: true / false
    },
    episodes: [{
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
        blocked: true / false,
        explicit: true / false,
        order: 1
    }, {...}
	]
}
```

## Fetching Remote Feeds

`podcast-feed-parser` can also fetch and parse remote feeds in both the browser and server environment thanks to `isomorphic-fetch`. Simply call `getPodcastFromURL(url, options)`. Functions which fetch remote feeds must be asynchronous and be utilize async/await.

```
const podcastFeedParser = require("podcast-feed-parser")

async function getNumberOfEpisodes (url) {
	const podcast = await podcastFeedParser.getPodcastFromURL(url)
	console.log(podcast.episodes.length)
}

getNumberOfEpisodes('http://feeds.gimletmedia.com/hearreplyall')
// 146

```
