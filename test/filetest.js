const podcastFeedParser = require('../index')
const fs = require('fs')
const path = require('path')
const testFilesPath = path.join(__dirname, 'testfiles')

// // //
// async function main () {
//   try {
//     var x = await podcastFeedParser.getPodcastFromURL('http://localhost:7000/bc-sample-new-feed-url.xml')
//   } catch (err) {
//     var x = err
//   }
//   console.log(x)
// }
//
// main ()

// console.log(Promise.resolve(podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/hearreplyall')))

// async function main () {
//   const sampleFeed = fs.readFileSync(testFilesPath+'/itunes-sample.xml', 'utf8').toString()
//   try {
//     var x = await podcastFeedParser.getPodcastFromFeed(sampleFeed)
//   } catch (err) {
//     var x = err
//   }
//   console.log(x)
// }
//
// main ()
 
// console.log(await podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/hearreplyall'))

// const options = {
//   fields : {
//     'meta': ['default', 'timeline', 'title'],
//     'episodes': ['default', 'book', 'description', 'pubDate', 'dogtag']
//   },
//   required: {
//     'meta': ['title'],
//     'episodes': ['pubDate']
//   },
//   uncleaned: {
//     'meta': ['description']
//   }
// }
// const options = {
//   required : {
//     meta: ['title']
//   }
// }
// const options = {
//   fields: {
//     'meta': ['title'],
//     'episodes': ['title', 'pubDate']
//   },
//   required : {
//     'meta': ['title']
//   },
//   uncleaned: {
//     'meta': ['title'],
//     'episodes': ['title', 'pubDate']
//   }
// }
const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-new-feed-url.xml', 'utf8').toString()
const x = podcastFeedParser.getPodcastFromFeed(sampleFeed)
// console.log(x)
