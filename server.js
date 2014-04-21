var app = require('./webServer'),
    config = require('./config'),
    fs = require('fs'),
    https = require('https'),

    api = {
        base:'https://prod.api.pvp.net/api/lol/na',
        key:config.apiKey
    },

    store = {
        champions:  [],
        games:      [],
        players:    [],
        summoners:  config.summoners
    },


getAllRecentGames = function(callback) {
    var summonerIndex = 1;

    for(var i = 0; i < store.summoners.length; i++) {
        getJSON('/v1.3/game/by-summoner/' + store.summoners[i].id + '/recent', function(data) {
            saveGame(data.summonerId, data.games);

            if(++summonerIndex > store.summoners.length && typeof callback === 'function')
                callback();
        });
    };
},

getJSON = function(endpoint, callback) {
    https.get(api.base + endpoint + '?api_key='+api.key, function(response) {
        var str = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            str += chunk;
        });
        response.on('end', function() {
            callback(JSON.parse(str));
        });
    });
},

find = function(collectionName, id) {
    var collection = store[collectionName];
    for(var i = 0; i < collection.length; i++)
        if(collection[i].id === id)
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

    // Fixes unknown bug.
    if(!('fellowPlayers' in rawGame))
        return;

    // Add the owning player and any friends to the players collection.
    store.players.push({
        game:       rawGame.gameId,
        summoner:   summoner,
        champion:   rawGame.championId,
        kills:      rawGame.stats.championsKilled || 0,
        deaths:     rawGame.stats.numDeaths || 0,
        assists:    rawGame.stats.assists || 0,
        minions:    rawGame.stats.minionsKilled,
        gold:       rawGame.stats.goldEarned,
        wards:      rawGame.stats.wardPlaced,
        item1:      rawGame.stats.item1,
        item2:      rawGame.stats.item2,
        item3:      rawGame.stats.item3,
        item4:      rawGame.stats.item4,
        item5:      rawGame.stats.item5,
        item6:      rawGame.stats.item6
    });

    // Check if the game has already been saved.
    if(find('games', rawGame.gameId) === null) {
        // Add the game data to the games collection.
        store.games.push({
            id:     rawGame.gameId,
            length: rawGame.stats.timePlayed,
            end:    rawGame.createDate,
            type:   rawGame.subType.replace('_', ' '),
            win:    rawGame.stats.win
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


// Initialize the app.

// Get all recent games and champion data.
getJSON('/v1.1/champion', function(data) {
    // Get all the champions (id and name).
    for(var i = 0; i < data.champions.length; i++) {
        store.champions.push({
            id:     data.champions[i].id,
            name:   data.champions[i].name
        });
    };

    getAllRecentGames(function() {
        app.init(__dirname, 8081);

        updateInterval = setInterval(function() {
            store.games = [];
            store.players = [];
            getAllRecentGames();
        }, 1000*60*15);
    });
});

