const podcastFeedParser = require('../index')
const fs = require('fs')
const path = require('path')
const testFilesPath = path.join(__dirname, 'testfiles')

// //
// async function main () {
//   try {
//     var x = await podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/hearreplyall')
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

const options = {
  fields : {
    'meta': ['title', 'description', 'imageURL', 'managingEditor'],
    'episodes': ['title', 'description', 'pubDate']
  },
  required: {
    'meta': ['title']
  },
  uncleaned: {
    'meta': ['description']
  }
}
const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8').toString()
const x = podcastFeedParser.getPodcastFromFeed(sampleFeed)
console.log(x.episodes[0])
