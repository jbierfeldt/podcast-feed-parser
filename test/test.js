/* eslint-disable no-unused-expressions */
/* global describe,it */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fs = require('fs');
const path = require('path');
const getPodcastFromFeed = require('../index');

const { expect } = chai;

const testFilesPath = path.join(__dirname, 'testfiles');

chai.use(chaiAsPromised);

const sampleFeed = fs.readFileSync(`${testFilesPath}/bc-sample.xml`, 'utf8').toString();
const badSampleFeed = fs.readFileSync(`${testFilesPath}/bc-sample-bad.xml`, 'utf8').toString();
const sampleFeedOrder = fs.readFileSync(`${testFilesPath}/bc-sample-order.xml`, 'utf8').toString();
const replyAllOrdering = fs.readFileSync(`${testFilesPath}/replyall-sample-ordering.xml`, 'utf8').toString();
const planeyMoney = fs.readFileSync(`${testFilesPath}/planet-money.xml`, 'utf8').toString();

describe('Reading files', () => {
  it('should read the file', () => {
    expect(sampleFeed).to.be.a('string');
  });
});

describe('Parsing Local Feeds', () => {
  it('should parse the feed and return a Podcast object', () => {
    expect(getPodcastFromFeed(sampleFeed)).to.be.an('object').that.contains.keys('meta', 'episodes');
  });

  it('should parse a bad feed and return an error', () => {
    expect(() => getPodcastFromFeed(badSampleFeed)).to.throw();
  });
});

describe('Getting Podcast Object from Sample Feed', () => {
  const podcast = getPodcastFromFeed(sampleFeed);

  it('should be a valid Podcast Object', () => {
    expect(podcast).to.be.an('object').that.contains.keys('meta', 'episodes');
  });

  describe('Checking Podcast Meta Information', () => {
    it('should be a valid object with all default fields', () => {
      expect(podcast.meta).to.be.an('object').that.contains.keys(
        'title', 'description', 'image', 'lastUpdated', 'link', 'links',
        'language', 'editor', 'author', 'summary', 'categories', 'owner',
        'explicit', 'generator',
      );
    });

    it('should have expected information', () => {
      expect(podcast.meta.title).to.equal('All Things Chemical');
      expect(podcast.meta.description).to.equal('All Things Chemical is a podcast produced by Bergeson & Campbell, P.C. (B&C®), a Washington D.C. law firm focusing on chemical law, business, and litigation matters. All Things Chemical is hosted by Lynn L. Bergeson, managing partner of B&C. In each episode, we bring you intelligent, insightful, and engaging conversation about everything related to industrial, pesticidal, and specialty chemicals, as well as the law and business issues surrounding chemicals. Our incredibly talented team of lawyers, scientists, and consultants keep you abreast of the changing world of both domestic and international chemical regulation and provide analysis of the many intriguing and complicated issues surrounding this space.');
      expect(podcast.meta.image.url).to.equal('https://ssl-static.libsyn.com/p/assets/0/0/e/b/00eb13bdea311055/AllThingsChemicalLogo1400.png');
      expect(podcast.meta.lastUpdated).to.equal('2018-12-06T17:51:50.000Z');
      expect(podcast.meta.link).to.equal('http://www.lawbc.com');
      expect(podcast.meta.language).to.equal('en');
      expect(podcast.meta.editor).to.equal('info@lawbc.com (info@lawbc.com)');
      expect(podcast.meta.author).to.equal('Bergeson & Campbell, PC');
      expect(podcast.meta.summary).to.equal('All Things Chemical is a podcast produced by Bergeson & Campbell, P.C. (B&C®), a Washington D.C. law firm focusing on chemical law, business, and litigation matters. All Things Chemical is hosted by Lynn L. Bergeson, managing partner of B&C. In each episode, we bring you intelligent, insightful, and engaging conversation about everything related to industrial, pesticidal, and specialty chemicals, as well as the law and business issues surrounding chemicals. Our incredibly talented team of lawyers, scientists, and consultants keep you abreast of the changing world of both domestic and international chemical regulation and provide analysis of the many intriguing and complicated issues surrounding this space.');
      expect(podcast.meta.categories).to.eql(['Business']);
      expect(podcast.meta.owner).to.eql({ name: 'Bergeson & Campbell, PC', email: 'info@lawbc.com' });
      expect(podcast.meta.explicit).to.equal(false);
      expect(podcast.meta.complete).to.be.undefined;
      expect(podcast.meta.blocked).to.be.undefined;
    });

    it('should have a links section', () => {
      expect(podcast.meta.links).to.be.an('array');
      expect(podcast.meta.links[0]).to.be.an('object').that.contains.keys('href', 'type', 'rel');
    });
  });

  describe('Parsing Planet Money', () => {
    const money = getPodcastFromFeed(planeyMoney);

    it('should have expected information', () => {
      expect(money.meta.title).to.equal('Planet Money');
      expect(money.meta.description).to.equal('The economy explained. Imagine you could call up a friend and say, "Meet me at the bar and tell me what\'s going on with the economy." Now imagine that\'s actually a fun evening.');
      expect(money.meta.image.url).to.equal('https://media.npr.org/assets/img/2018/08/02/npr_planetmoney_podcasttile_sq-7b7fab0b52fd72826936c3dbe51cff94889797a0.jpg?s=1400');
      expect(money.meta.type).to.equal('episodic');
      expect(money.meta.link).to.equal('https://www.npr.org/planetmoney');
      expect(money.meta.language).to.equal('en');
      expect(money.meta.author).to.equal('NPR');
      expect(money.meta.summary).to.equal(money.meta.description);
      expect(money.meta.categories).to.eql(['Business']);
      expect(money.meta.owner).to.eql({ name: 'NPR', email: 'podcasts@npr.org' });
      expect(money.meta.explicit).to.be.undefined;
      expect(money.meta.complete).to.be.undefined;
      expect(money.meta.blocked).to.eql(false);
    });
  });

  describe('Checking Podcast Episode Information', () => {
    it('should have expected number of episodes', () => {
      expect(podcast.episodes).to.have.length(4);
    });

    it('should list episodes in order of newest to oldest', () => {
      expect(podcast.episodes[0].title).to.be.equal('Confidential Business Information under TSCA');
      expect(podcast.episodes[3].title).to.be.equal('Introducing All Things Chemical ');
    });

    describe('Checking Episode of Podcast', () => {
      it('should be a valid object with all default fields', () => {
        expect(podcast.episodes[0]).to.be.an('object').that.contains.keys(
          'title', 'description', 'subtitle', 'image', 'pubDate',
          'link', 'enclosure', 'duration', 'summary',
          'explicit', 'guid', 'episode', 'episodeType', 'season',
        );
      });

      it('should have expected information', () => {
        expect(podcast.episodes[0].title).to.equal('Confidential Business Information under TSCA');
        expect(podcast.episodes[0].description).to.equal('<p>This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from trade secrets to you know, the secret sauce of a chemical formulation that makes a product profitable. In our conversation, we focused on how this concept of CBI functions under TSCA and how businesses need to handle CBI during the EPA’s chemical review process.</p> <p>Rich is the perfect person to discuss the concept of CBI. Rich is 17-year veteran of the U.S. Environmental Protection Agency (EPA). He has participated in thousands of Toxic Substances Control Act (TSCA) substance reviews at EPA, and knows the ins-and-outs of how CBI should be handled.</p> <p>Our conversation touches upon some of the most important legal and business considerations when dealing with CBI and the EPA: how the EPA exactly defines CBI, where problems can arise, and how to avoid these through careful preparation and planning.</p> <p>ALL MATERIALS IN THIS PODCAST ARE PROVIDED SOLELY FOR INFORMATIONAL AND ENTERTAINMENT PURPOSES. THE MATERIALS ARE NOT INTENDED TO CONSTITUTE LEGAL ADVICE OR THE PROVISION OF LEGAL SERVICES. ALL LEGAL QUESTIONS SHOULD BE ANSWERED DIRECTLY BY A LICENSED ATTORNEY PRACTICING IN THE APPLICABLE AREA OF LAW.</p> <p> </p>');
        expect(podcast.episodes[0].subtitle).to.equal('This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from...');
        expect(podcast.episodes[0].image.url).to.equal('https://ssl-static.libsyn.com/p/assets/0/0/e/b/00eb13bdea311055/AllThingsChemicalLogo1400.png');
        expect(podcast.episodes[0].pubDate).to.equal('2018-11-29T10:30:00.000Z');
        expect(podcast.episodes[0].link).to.equal('http://allthingschemical.libsyn.com/confidential-business-information-under-tsca');
        expect(podcast.episodes[0].language).to.be.undefined;
        expect(podcast.episodes[0].enclosure).to.eql({
          length: '28882931',
          type: 'audio/mpeg',
          url: 'https://traffic.libsyn.com/secure/allthingschemical/ep3_final_96.mp3?dest-id=814653',
        });
        expect(podcast.episodes[0].duration).to.equal(2398);
        expect(podcast.episodes[0].summary).to.equal('This week, I sat down with Dr. Richard Engler, our Director of Chemistry, to discuss Confidential Business Information (CBI). CBI is both a term of art under the Toxic Substances Control Act (TSCA) and can be understood broadly to be anything from trade secrets to you know, the secret sauce of a chemical formulation that makes a product profitable. In our conversation, we focused on how this concept of CBI functions under TSCA and how businesses need to handle CBI during the EPA’s chemical review process.');
        expect(podcast.episodes[0].blocked).to.be.undefined;
        expect(podcast.episodes[0].explicit).to.equal(false);
        expect(podcast.episodes[0].order).to.be.undefined;
      });
    });
  });
});

describe('Checking re-ordering functionality', () => {
  it('should list episodes in order described by order tags in the rss feed', () => {
    const podcast = getPodcastFromFeed(sampleFeedOrder);
    expect(podcast.episodes[3].title).to.equal('Chemical Regulation in the Middle East'); // order 1
    expect(podcast.episodes[2].title).to.equal('Animal Testing and New TSCA'); // order 2
    expect(podcast.episodes[1].title).to.equal('Introducing All Things Chemical '); // default ordering by pubDate
  });

  it('should order by title when no order is specified and pubDate is the same', () => {
    const podcast = getPodcastFromFeed(replyAllOrdering);
    expect(podcast.episodes[2].title).to.equal('Reply All Mic Test'); // first by pubDate
    expect(podcast.episodes[1].title).to.equal('#1 A Stranger Says I Love You'); // pubDate is the same, order by title
    expect(podcast.episodes[0].title).to.equal('#2 The Secret, Gruesome Internet For Doctors'); // pubDate is the same, order by title
  });
});
