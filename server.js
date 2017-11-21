var app = require('./webServer'),
    config = require('./config'),
    fs = require('fs'),
    https = require('https'),

    UPDATES_PER_HOUR = 4,

    api = {
        base:'https://na1.api.riotgames.com/lol',
        key:config.apiKey
    },

    matchCache = {},

    store = {
        champions:  [],
        games:      [],
        items:      [],
        players:    [],
        summoners:  config.summoners,
        queues: [{
            id: 400,
            name: '5v5 Draft'
        }, {
            id: 420,
            name: '5v5 Ranked Solo/Duo'
        }, {
            id: 440,
            name: '5v5 Ranked Flex'
        }, {
            id: 450,
            name: 'ARAM'
        }]
    },


getAllRecentGames = function(callback) {
    store.summoners.forEach(function (summoner, i) {
        getJSON('/match/v3/matchlists/by-account/' + summoner.id + '/recent', function(data) {
            saveGame(summoner.id, data.matches);

            if(i === store.summoners.length - 1 && typeof callback === 'function')
                callback();
        });
    });
},

getJSON = function(endpoint, options, callback) {
    var query = '?api_key=' + api.key,
        url = api.base + endpoint;

    if(typeof options === 'function') {
        callback = options;
    } else {
        if('params' in options)
            for(var key in options.params)
                if(Array.isArray(options.params[key]))
                    query += '&' + options.params[key].map(function (val) { return key + '=' + val; }).join('&');
                else
                    query += '&' + key + '=' + options.params[key];
    };

    url += query;

    https.get(url, function(response) {
        var str = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            str += chunk;
        });
        response.on('end', function() {
            var data = JSON.parse(str);
            if (data.status && data.status.status_code !== 200)
                console.log(endpoint, data.status);
            else
                callback(data);
        });
    });
},

find = function(collection, id, key) {
    key || (key = 'id');
    for(var i = 0; i < collection.length; i++)
        if(collection[i][key] === id)
            return collection[i];
    return null;
},

saveGame = function(summoner, rawGame) {
    // This method accepts an array of raw game data,
    // in which case it will call itself recursively.
    if(Array.isArray(rawGame)) {
        for(var i = 0; i < rawGame.length; i++)
            saveGame(summoner, rawGame[i]);
        return;
    };

    // Add the owning player and any friends to the players collection.
    store.players.push({
        game:       rawGame.gameId,
        summoner:   summoner,
        champion:   rawGame.champion,
        kills:      0,
        deaths:     0,
        assists:    0,
        minions:    0,
        gold:       0,
        wards:      0,
        item0:      {},
        item1:      {},
        item2:      {},
        item3:      {},
        item4:      {},
        item5:      {},
        item6:      {}
    });

    // Check if the game has already been saved.
    if(find(store.games, rawGame.gameId) === null) {
        // Add the game data to the games collection.
        store.games.push({
            id:     rawGame.gameId,
            length: 0,
            end:    rawGame.timestamp,
            type:   rawGame.queue,
            win:    true
        });
    };
};

// Register the route handlers.
app.get(['/', '/index.html'], function(request, response) {
    fs.readFile(__dirname+'/index.html', function(err, file) {
        var html = file.toString().replace('{{prerender json}}', JSON.stringify(store));
        app.respond(response, 200, {'Content-Type':'text/html'}, html);
    });
});


app.get('/api/matches/(\\d+)', function(request, response) {
    var matchId = request.params[0];
    if(!find(store.games, matchId)) {
        app.respond(response, 404, {'Content-Type':'application/json'}, '{"message":"match id not found"}');
    } else if(matchId in matchCache) {
        app.respond(response, 200, {'Content-Type':'application/json'}, matchCache[matchId]);
    } else {
        getJSON('/match/v3/matches/' + matchId, function(resp) {
            var players = resp.participantIdentities.filter(function (p) {
                return find(store.summoners, p.player.accountId);
            }).map(function(part) {
                var p = find(resp.participants, part.participantId, 'participantId');
                return {
                    id:      part.player.accountId,
                    win:     p.stats.win,
                    kills:   p.stats.kills,
                    deaths:  p.stats.deaths,
                    assists: p.stats.assists,
                    minions: p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled,
                    gold:    p.stats.goldEarned,
                    wards:   p.stats.wardsPlaced,
                    item0:   p.stats.item0,
                    item1:   p.stats.item1,
                    item2:   p.stats.item2,
                    item3:   p.stats.item3,
                    item4:   p.stats.item4,
                    item5:   p.stats.item5,
                    item6:   p.stats.item6
                }
            });

            matchCache[matchId] = JSON.stringify(players);
            app.respond(response, 200, {'Content-Type':'application/json'}, matchCache[matchId]);
        });
    }
});


// Initialize the app.

// All the static data (champions and items)
// is retrieved once at startup.

getJSON('/static-data/v3/champions', function(response) {
    // Get all the champions (id and name).
    var champions = response.data;
    Object.keys(champions).forEach(function (name) {
        store.champions.push({
            id:     champions[name].id,
            name:   name,
            title:  champions[name].title
        });
    });

    getJSON('/static-data/v3/items', {params:{tags: ['from', 'image', 'inStore', 'sanitizedDescription']}}, function(response) {
        var item = {};
        for(var id in response.data) {
            item = response.data[id];

            store.items.push({
                id:         item.id,
                description:item.sanitizedDescription,
                from:       ('from' in item) ? item.from.map(function(x) { return parseInt(x, 10); }) : [],
                image:      item.image,
                name:       item.name
            });
        };

        getAllRecentGames(function() {
            app.init(__dirname, 8081);

            updateInterval = setInterval(function() {
                store.games = [];
                store.players = [];
                getAllRecentGames();
            }, 1000*60*60/UPDATES_PER_HOUR);
        });
    });
});
