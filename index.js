const { parseString } = require('xml2js');

const ITUNES_URI = 'http://www.itunes.com/dtds/podcast-1.0.dtd';
const GOOGLE_URI = 'http://www.google.com/schemas/play-podcasts/1.0';
const ATOM_URI = 'http://www.w3.org/2005/Atom';

const EMPTY_VALUES = [null, undefined, '', NaN];

function isEmptyObject(obj) {
  return (Object.keys(obj).length === 0 && obj.constructor === Object);
}

function removeEmpties(obj) {
  // Filter empty Array values
  if (Array.isArray(obj)) {
    return obj.filter((item) => !(EMPTY_VALUES.includes(item) || isEmptyObject(item)));
  }

  // Filter empty Object properties
  const nonEmptyKeys = Object.keys(obj)
    .filter((key) => !(EMPTY_VALUES.includes(obj[key]) || isEmptyObject(obj[key])));
  return nonEmptyKeys.reduce((filteredObj, key) => ({
    ...filteredObj,
    [key]: obj[key],
  }), {});
}

const OPTIONS = Object.freeze({
  fields: {
    meta: [
      'title', 'description', 'subtitle', 'image', 'lastUpdated', 'link',
      'language', 'editor', 'author', 'summary', 'categories', 'owner',
      'explicit', 'complete', 'blocked', 'webmaster', 'type', 'generator', 'ttl',
    ],
    episodes: [
      'title', 'description', 'subtitle', 'image', 'pubDate',
      'link', 'language', 'enclosure', 'duration', 'summary', 'blocked',
      'explicit', 'order', 'guid', 'season', 'episode', 'episodeType',
    ],
  },
});

/*
=====================
=== GET FUNCTIONS ===
=====================
*/

function getters(ns) {
  return {
    image(node) {
      return node.image || node[`${ns.itunes}:image`] || node[`${ns.googleplay}:image`];
    },

    subtitle(node) {
      return node[`${ns.itunes}:subtitle`];
    },

    lastUpdated(node) {
      return node.lastBuildDate;
    },

    editor(node) {
      return node.managingEditor;
    },

    webmaster(node) {
      return node.webMaster;
    },

    author(node) {
      return node[`${ns.itunes}:author`] || node[`${ns.googleplay}:author`];
    },

    summary(node) {
      return node[`${ns.itunes}:summary`];
    },

    owner(node) {
      return node[`${ns.itunes}:owner`];
    },

    explicit(node) {
      return node[`${ns.itunes}:explicit`] || node[`${ns.googleplay}:explicit`];
    },

    complete(node) {
      return node[`${ns.itunes}:complete`];
    },

    blocked(node) {
      return node[`${ns.itunes}:block`];
    },

    order(node) {
      return node[`${ns.itunes}:order`];
    },

    duration(node) {
      return node[`${ns.itunes}:duration`];
    },

    season(node) {
      return node[`${ns.itunes}:season`];
    },

    episode(node) {
      return node[`${ns.itunes}:episode`];
    },

    episodeType(node) {
      return node[`${ns.itunes}:episodeType`];
    },

    type(node) {
      return node[`${ns.itunes}:type`];
    },

    categories(node) {
      // returns categories as an array containing each category/sub-category
      // grouping in lists. If there is a sub-category, it is the second element
      // of an array.

      const categoryAttr = `${ns.itunes}:category`;
      const categoriesArray = node[categoryAttr].map((item) => {
        const category = [];
        category.push(item.$.text); // primary category
        if (item[categoryAttr]) { // sub-category
          category.push(item[categoryAttr][0].$.text);
        }
        return category;
      });

      return removeEmpties(categoriesArray);
    },
  };
}

function getDefault(node, field) {
  return (node[field]) ? node[field] : undefined;
}

/*
=======================
=== CLEAN FUNCTIONS ===
=======================
*/

function cleaners(ns) {
  return {
    enclosure([enclosure]) {
      return removeEmpties({
        length: enclosure.$.length,
        type: enclosure.$.type,
        url: enclosure.$.url,
      });
    },

    image([img]) {
      // itunes:image
      if ('$' in img) {
        return {
          url: img.$.href,
        };
      }

      // image
      return removeEmpties({
        url: ('url' in img) ? img.url[0] : '',
        title: ('title' in img) ? img.title[0] : '',
        link: ('link' in img) ? img.link[0] : '',
        width: ('width' in img) ? Number.parseInt(img.width[0], 10) : NaN,
        height: ('height' in img) ? Number.parseInt(img.height[0], 10) : NaN,
      });
    },

    duration(string) {
      // Duration given in one of three formats:
      // * [hours]:[minutes]:[seconds]
      // * [minutes]:[seconds]
      // * [total_seconds]
      const times = string[0].split(':').map(Number);
      const [h, m, s] = times;
      switch (times.length) {
        case 3:
          return (60 * 60 * h) + (60 * m) + s;
        case 2:
          return (60 * h) + m;
        default:
          return h;
      }
    },

    ttl([num]) {
      // https://cyber.harvard.edu/rss/rss.html
      // ttl - time to live, in minutes
      // indicates how long a channel is cached for
      return Number.parseInt(num, 10);
    },

    owner([object]) {
      const name = `${ns.itunes}:name`;
      const email = `${ns.itunes}:email`;

      return removeEmpties({
        name: (name in object) ? object[name][0] : '',
        email: (email in object) ? object[email][0] : '',
      });
    },

    atom(link) {
      if (link && link.$) {
        return removeEmpties({
          href: link.$.href,
          type: link.$.type,
          rel: link.$.rel,
        });
      }
      return undefined;
    },

    lastUpdated(string) {
      return new Date(string).toISOString();
    },

    pubDate(string) {
      return new Date(string).toISOString();
    },

    complete(string) {
      return ((string[0] || '').toLowerCase() === 'yes');
    },

    blocked(string) {
      return ((string[0] || '').toLowerCase() === 'yes');
    },

    explicit(string) {
      const explicit = (string[0] || '').toLowerCase();
      if (['yes', 'explicit', 'true'].includes(explicit)) {
        return true;
      }
      if (['clean', 'no', 'false'].includes(explicit)) {
        return false;
      }
      return undefined;
    },
  };
}

function cleanDefault(node) {
  // return first item of array
  if (node !== undefined && Array.isArray(node) && node[0] !== undefined) {
    return node[0];
  }
  return node;
}

/*
=================================
=== OBJECT CREATION FUNCTIONS ===
=================================
*/

function getInfo(node, field, GET, CLEAN) {
  const info = (field in GET && GET[field]) ? GET[field](node) : getDefault(node, field);
  return (field in CLEAN && info) ? CLEAN[field](info) : cleanDefault(info);
}

function createMetaObjectFromFeed(channel, namespaces) {
  const GET = getters(namespaces);
  const CLEAN = cleaners(namespaces);

  const meta = OPTIONS.fields.meta.reduce((metaObj, field) => ({
    ...metaObj,
    [field]: getInfo(channel, field, GET, CLEAN),
  }), {});

  return removeEmpties(meta);
}

// sorts by order first, if defined, then sorts by date.
// if multiple episodes were published at the same time,
// they are then sorted by title
function episodeComparator(a, b) {
  if (a.order === b.order) {
    if (a.pubDate === b.pubDate) {
      return (a.title > b.title) ? -1 : 1;
    }
    return (b.pubDate > a.pubDate) ? 1 : -1;
  }

  if (a.order && !b.order) {
    return 1;
  }

  if (b.order && !a.order) {
    return -1;
  }

  return (a.order > b.order) ? -1 : 1;
}

// function builds episode objects from parsed podcast feed
function createEpisodesObjectFromFeed(channel, namespaces) {
  const GET = getters(namespaces);
  const CLEAN = cleaners(namespaces);

  const episodes = channel.item.map((item) => {
    // Retrieve all fields for this episode
    const episode = OPTIONS.fields.episodes.reduce((episodeObj, field) => ({
      ...episodeObj,
      [field]: getInfo(item, field, GET, CLEAN),
    }), {});

    return removeEmpties(episode);
  });

  return episodes.sort(episodeComparator);
}

function createLinksObjectFromFeed(channel, namespaces) {
  const CLEAN = cleaners(namespaces);
  const links = [...(channel[`${namespaces.atom}:link`] || []), ...(channel.link || [])];
  return removeEmpties(links.map(CLEAN.atom));
}

/*
======================
=== FEED FUNCTIONS ===
======================
*/

function parseXMLFeed(feedText) {
  let feed = {};
  parseString(feedText, (error, result) => {
    if (error) {
      throw new Error(`Error parsing feed: ${error.message}`);
    }
    Object.assign(feed, result);
    return result;
  });
  return feed;
}

const XMLNS = 'xmlns:';
function getNamespacePrefix(feed, nsUri, defaultPrefix) {
  const [prefix] = (Object.entries(feed.rss.$).find(([_, uri]) => uri === nsUri) || []);
  return (((prefix || '').startsWith(XMLNS)) ? prefix.substr(XMLNS.length) : prefix) || defaultPrefix;
}

function getNamespaces(feed) {
  return {
    itunes: getNamespacePrefix(feed, ITUNES_URI, 'itunes'),
    googleplay: getNamespacePrefix(feed, GOOGLE_URI, 'googleplay'),
    atom: getNamespacePrefix(feed, ATOM_URI, 'atom'),
  };
}

/*
=======================
=== FINAL FUNCTIONS ===
=======================
*/

module.exports = function getPodcastFromFeed(feed) {
  const feedObject = parseXMLFeed(feed);
  const namespaces = getNamespaces(feedObject);
  const channel = feedObject.rss.channel[0];

  const meta = createMetaObjectFromFeed(channel, namespaces);
  const episodes = createEpisodesObjectFromFeed(channel, namespaces);
  const links = createLinksObjectFromFeed(channel, namespaces);

  return { meta: { ...meta, links }, episodes };
};
