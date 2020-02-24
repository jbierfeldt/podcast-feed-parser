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
  it('should read the file', function (){
    expect(fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8')).to.be.a('string')
  })
})

describe('Fetching Feeds', function () {
  it('should fetch the feed and receive a promise', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://allthingschemical.libsyn.com/rss')).to.be.a('promise')
  })
  it('should fetch the feed and receive a promise that is fulfilled', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://allthingschemical.libsyn.com/rss')).to.eventually.be.fulfilled
  })
  it('should fetch the feed and receive a promise that is rejected', async function () {
    await expect(podcastFeedParser.getPodcastFromURL('http://allthingschemical.libsyn.com/notarealurl')).to.eventually.be.rejected
  })
})

describe('Parsing Local Feeds', function () {
  const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8').toString()
  const badSampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-bad.xml', 'utf8').toString()

  it('should parse the feed and return a Podcast object', function () {
    expect(podcastFeedParser.getPodcastFromFeed(sampleFeed)).to.be.an('object').that.contains.keys('meta', 'episodes')
  })
  it('should parse a bad feed and return an error', function () {
    expect(podcastFeedParser.getPodcastFromFeed.bind(podcastFeedParser, badSampleFeed)).to.throw(ERRORS.parsingError)
  })
})

describe('Getting Podcast Object from Sample Feed', function () {
  const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample.xml', 'utf8').toString()
  const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)

  it('should be a valid Podcast Object', function () {
    expect(podcast).to.be.an('object').that.contains.keys('meta', 'episodes')
  })

  describe('Checking Podcast Meta Information', function () {

    it('should be a valid object with all default fields', function () {
      expect(podcast.meta).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
        'language', 'editor', 'author', 'summary', 'categories', 'owner',
        'explicit', 'complete', 'blocked')
    })
    it('should have expected information', function () {
      expect(podcast.meta.title).to.equal('All Things Chemical')
      expect(podcast.meta.description).to.equal('All Things Chemical is a podcast produced by Bergeson & Campbell, P.C. (B&C®), a Washington D.C. law firm focusing on chemical law, business, and litigation matters. All Things Chemical is hosted by Lynn L. Bergeson, managing partner of B&C. In each episode, we bring you intelligent, insightful, and engaging conversation about everything related to industrial, pesticidal, and specialty chemicals, as well as the law and business issues surrounding chemicals. Our incredibly talented team of lawyers, scientists, and consultants keep you abreast of the changing world of both domestic and international chemical regulation and provide analysis of the many intriguing and complicated issues surrounding this space.')
      expect(podcast.meta.subtitle).to.equal('')
      expect(podcast.meta.imageURL).to.equal('https://ssl-static.libsyn.com/p/assets/0/0/e/b/00eb13bdea311055/AllThingsChemicalLogo1400.png')
      expect(podcast.meta.lastUpdated).to.equal('2018-12-06T17:51:50.000Z')
      expect(podcast.meta.link).to.equal('http://www.lawbc.com')
      expect(podcast.meta.language).to.equal('en')
      expect(podcast.meta.editor).to.equal('info@lawbc.com (info@lawbc.com)')
      expect(podcast.meta.author).to.equal('Bergeson & Campbell, PC')
      expect(podcast.meta.summary).to.equal('All Things Chemical is a podcast produced by Bergeson & Campbell, P.C. (B&C®), a Washington D.C. law firm focusing on chemical law, business, and litigation matters. All Things Chemical is hosted by Lynn L. Bergeson, managing partner of B&C. In each episode, we bring you intelligent, insightful, and engaging conversation about everything related to industrial, pesticidal, and specialty chemicals, as well as the law and business issues surrounding chemicals. Our incredibly talented team of lawyers, scientists, and consultants keep you abreast of the changing world of both domestic and international chemical regulation and provide analysis of the many intriguing and complicated issues surrounding this space.')
      expect(podcast.meta.categories).to.eql(['Business'])
      expect(podcast.meta.owner).to.eql({ name: 'Bergeson & Campbell, PC', email: 'info@lawbc.com' })
      expect(podcast.meta.explicit).to.equal(false)
      expect(podcast.meta.complete).to.be.undefined
      expect(podcast.meta.blocked).to.be.undefined
    })
  })

  describe('Checking Podcast Episode Information', function () {

    it('should have expected number of episodes', function () {
      expect(podcast.episodes).to.have.length(4)
    })

    it('should list episodes in order of newest to oldest', function () {
      expect(podcast.episodes[0].title).to.be.equal('Confidential Business Information under TSCA')
      expect(podcast.episodes[3].title).to.be.equal('Introducing All Things Chemical ')
    })

    describe('Checking Episode of Podcast', function () {

      it('should be a valid object with all default fields', function () {
        expect(podcast.episodes[0]).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'pubDate',
            'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
            'explicit', 'order')
      })

      it('should have expected information', function () {
        expect(podcast.episodes[0].title).to.equal('Confidential Business Information under TSCA')
        expect(podcast.episodes[0].description).to.equal('<p>This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from trade secrets to you know, the secret sauce of a chemical formulation that makes a product profitable. In our conversation, we focused on how this concept of CBI functions under TSCA and how businesses need to handle CBI during the EPA’s chemical review process.</p> <p>Rich is the perfect person to discuss the concept of CBI. Rich is 17-year veteran of the U.S. Environmental Protection Agency (EPA). He has participated in thousands of Toxic Substances Control Act (TSCA) substance reviews at EPA, and knows the ins-and-outs of how CBI should be handled.</p> <p>Our conversation touches upon some of the most important legal and business considerations when dealing with CBI and the EPA: how the EPA exactly defines CBI, where problems can arise, and how to avoid these through careful preparation and planning.</p> <p>ALL MATERIALS IN THIS PODCAST ARE PROVIDED SOLELY FOR INFORMATIONAL AND ENTERTAINMENT PURPOSES. THE MATERIALS ARE NOT INTENDED TO CONSTITUTE LEGAL ADVICE OR THE PROVISION OF LEGAL SERVICES. ALL LEGAL QUESTIONS SHOULD BE ANSWERED DIRECTLY BY A LICENSED ATTORNEY PRACTICING IN THE APPLICABLE AREA OF LAW.</p> <p> </p>')
        expect(podcast.episodes[0].subtitle).to.equal('This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from...')
        expect(podcast.episodes[0].imageURL).to.equal('https://ssl-static.libsyn.com/p/assets/0/0/e/b/00eb13bdea311055/AllThingsChemicalLogo1400.png')
        expect(podcast.episodes[0].pubDate).to.equal('2018-11-29T10:30:00.000Z')
        expect(podcast.episodes[0].link).to.equal('http://allthingschemical.libsyn.com/confidential-business-information-under-tsca')
        expect(podcast.episodes[0].language).to.be.undefined
        expect(podcast.episodes[0].enclosure).to.eql({
          length: '28882931',
          type: 'audio/mpeg',
          url: 'https://traffic.libsyn.com/secure/allthingschemical/ep3_final_96.mp3?dest-id=814653'
        })
        expect(podcast.episodes[0].duration).to.equal(2398)
        expect(podcast.episodes[0].summary).to.equal('This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from trade secrets to you know, the secret sauce of a chemical formulation that makes a product profitable. In our conversation, we focused on how this concept of CBI functions under TSCA and how businesses need to handle CBI during the EPA’s chemical review process.')
        expect(podcast.episodes[0].blocked).to.be.undefined
        expect(podcast.episodes[0].explicit).to.equal(false)
        expect(podcast.episodes[0].order).to.be.undefined
      })
    })
  })
})

describe('Checking custom options', function () {
  const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-custom-tags.xml', 'utf8').toString()
  it('should return object with all default fields when no options object is provided', function() {
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.meta).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
      'language', 'editor', 'author', 'summary', 'categories', 'owner',
      'explicit', 'complete', 'blocked')
    expect(podcast.episodes[0]).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'pubDate',
        'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
        'explicit', 'order')
  })

  it('should return object with all default fields when default is specified in options object', function() {
    const options = {
      fields : {
        'meta': ['default'],
        'episodes': ['default']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
      'language', 'editor', 'author', 'summary', 'categories', 'owner',
      'explicit', 'complete', 'blocked')
    expect(podcast.episodes[0]).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'pubDate',
        'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
        'explicit', 'order')
  })

  it('should return object with default fields + custom field', function() {
    const options = {
      fields : {
        'meta': ['default', 'webMaster'],
        'episodes': ['default', 'timeline']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'lastUpdated', 'link',
      'language', 'editor', 'author', 'summary', 'categories', 'owner',
      'explicit', 'complete', 'blocked', 'webMaster')
    expect(podcast.episodes[0]).to.be.an('object').that.contains.keys('title', 'description', 'subtitle', 'imageURL', 'pubDate',
        'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
        'explicit', 'order', 'timeline')
  })

  it('should return object with only given custom fields', function() {
    const options = {
      fields : {
        'meta': ['title', 'description', 'webMaster'],
        'episodes': ['title', 'pubDate', 'timeline']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta).to.be.an('object').that.contains.keys('title', 'description', 'webMaster')
    expect(podcast.episodes[0]).to.be.an('object').that.contains.keys('title', 'pubDate', 'timeline')
  })

  it('should return valid object because required field exists', function() {
    const options = {
      required : {
        meta: ['title'],
        episodes: ['pubDate']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.episodes[0]).to.be.an('object')
  })

  it('should throw a requiredError because of missing required fields', function() {
    const options = {
      required : {
        meta: ['booklink']
      }
    }
    expect(podcastFeedParser.getPodcastFromFeed.bind(podcastFeedParser, sampleFeed, options)).to.throw(ERRORS.requiredError)
  })

  it('should return an object with uncleaned title field', function() {
    const options = {
      uncleaned: {
        'meta': 'title'
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta.title).to.be.an('array')
  })

  it('should return an object with uncleaned duration field', function() {
    const options = {
      uncleaned: {
        'episodes': ['duration']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.episodes[0].duration[0]).to.be.a('string')
  })
})

describe("Checking re-ordering functionality", function() {
  it('should list episodes in order described by order tags in the rss feed', function() {
    const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-order.xml', 'utf8').toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.episodes[3].title).to.equal('Chemical Regulation in the Middle East') // order 1
    expect(podcast.episodes[2].title).to.equal('Animal Testing and New TSCA') // order 2
    expect(podcast.episodes[1].title).to.equal('Introducing All Things Chemical ') // default ordering by pubDate
  })

  it('should order by title when no order is specified and pubDate is the same', async function() {
    const sampleFeed = fs.readFileSync(testFilesPath+'/replyall-sample-ordering.xml', 'utf8').toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.episodes[2].title).to.equal('Reply All Mic Test') // first by pubDate
    expect(podcast.episodes[1].title).to.equal('#1 A Stranger Says I Love You') // pubDate is the same, order by title
    expect(podcast.episodes[0].title).to.equal('#2 The Secret, Gruesome Internet For Doctors') // pubDate is the same, order by title
  })
})

describe("Checking handling of new-feed-url", function() {
  it('should ignore new-feed-url element and parse feed normally', function() {
    const sampleFeed = fs.readFileSync(testFilesPath+'/bc-sample-new-feed-url.xml', 'utf8').toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.meta.title).to.equal('All Things Chemical')
  })

/*
  it('should redirect and fetch new feed', async function() {
    const podcast = await podcastFeedParser.getPodcastFromURL('http://sandbox.bierfeldt.me/podcast-feed-parser/testfiles/bc-sample-new-feed-url.xml')
    expect(podcast.meta.title).to.equal('Reply All')
  })
*/
})
