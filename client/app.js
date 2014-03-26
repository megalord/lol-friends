spider.define('app', function() {

    var store = spider.fetch('store'),
        view = spider.fetch('view'),
    
    clone = function(data) {
        return JSON.parse(JSON.stringify(data));
    };

    diesel.router.config({history:false})
    .when('/', function() {
        view.home();
    })
    .when('/games/all', function() {
        var games = clone(store.games);

        // Sort the games descending by date.
        games.sort(function(a, b) {
            return b.start - a.start;
        });

        for(var i = 0; i < games.length; i++) {
            games[i].players = store.query('players', {game:games[i].id});
            for(var j = 0; j < games[i].players.length; j++) {
                games[i].players[j].summonerName = store.find('summoners', games[i].players[j].summoner).name;
                games[i].players[j].championName = store.find('champions', games[i].players[j].champion).name;
            };
        };

        view.allGames(games);
    })
    .when('/games/:id', function(params) {
        var game = clone(store.find('games', parseInt(params.id))),
            players = store.query('players', {game:parseInt(params.id)});

        game.players = clone(players);

        for(var i = 0; i < players.length; i++) {
            game.players[i].summonerName = store.find('summoners', players[i].summoner).name;
            game.players[i].championName = store.find('champions', players[i].champion).name;
        };

        view.game(game);
    })
    .when('/summoners/all', function() {
        view.summoners(store.summoners);
    })
    .when('/summoners/:id', function(params) {
        var champion,
            championCache = {},
            summoner = clone(store.find('summoners', parseInt(params.id)));
        summoner.games = clone(store.query('players', {summoner:parseInt(params.id)}));
        summoner.champions = [];
        summoner.stats = {
            kills:0,
            deaths:0,
            assists:0,
            minions:0,
            gold:0,
            wins:0,
            losses:0
        };

        // Aggregate the stats for each game.
        for(var i = 0; i < summoner.games.length; i++) {
            summoner.stats.kills += summoner.games[i].kills;
            summoner.stats.deaths += summoner.games[i].deaths;
            summoner.stats.assists += summoner.games[i].assists;
            summoner.stats.minions += summoner.games[i].minions;
            summoner.stats.gold += summoner.games[i].gold;
            summoner.stats[store.find('games', summoner.games[i].game).win ? 'wins' : 'losses'] += 1;

            champion = summoner.games[i].champion;
            if(champion in championCache) {
                summoner.champions[championCache[champion]].count += 1
            } else {
                championCache[champion] = summoner.champions.push({
                    name:store.find('champions', champion).name,
                    count:1
                }) - 1;
            };
        };

        // Take averages and sanitize numbers.
        for(var stat in summoner.stats)
            if(stat !== 'wins' && stat !== 'losses')
                summoner.stats[stat] = summoner.stats[stat] / 10;

        summoner.stats.minions = Math.round(summoner.stats.minions);
        summoner.stats.gold = Math.round(summoner.stats.gold);

        summoner.champions.sort(function(a, b) {
            return b.count - a.count;
        });

        view.summoner(summoner);
    })
    .start();

    //diesel.router.navigateTo('/');
});
