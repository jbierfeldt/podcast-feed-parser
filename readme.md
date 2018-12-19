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
