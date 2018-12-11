const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs')
const path = require('path')
const podcastFeedParser = require('../index')
const ERRORS = podcastFeedParser.ERRORS

const testFilesPath = path.join(__dirname, 'testfiles')

chai.use(chaiAsPromised)

describe('Reading files', function () {
  it('should fetch the file', function (){
    expect(fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8').toString()).to.be.a('string')
  })
})

describe('Fetching Feeds', function () {
  it('should fetch the feed and receive a promise', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/hearreplyall')).to.be.a('promise')
  })
  it('should fetch the feed and receive a promise that is fulfilled', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/hearreplyall')).to.eventually.be.fulfilled
  })
  it('should fetch the feed and receive a promise that is rejected', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://feeds.gimletmedia.com/notarealurl')).to.eventually.be.rejected
  })
})

describe('Parsing Local Feeds', function () {
  const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8').toString()
  const badSampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-bad.xml', 'utf8').toString()
  it('should parse the feed and return an object', function () {
    expect(podcastFeedParser.getPodcastFromFeed(sampleFeed)).to.be.an('object')
  })
  it('should parse the feed and return an error', function () {
    expect(podcastFeedParser.getPodcastFromFeed.bind(podcastFeedParser, badSampleFeed)).to.throw(ERRORS.parsingError)
  })
})
