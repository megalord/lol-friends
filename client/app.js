spider.define('app', function() {

    var store = spider.fetch('store'),
        view = spider.fetch('view'),
        
        mergedPlayers = store.players.copy()
            .merge(store.champions, 'champion')
            .merge(store.summoners, 'summoner');

    for(var i = 0; i < 7; i++)
        mergedPlayers.merge(store.items, 'item'+i);
    
    diesel.router.config({history:false})

    .when('/', function() {
        view.home();
    })

    /*.when('/champions/all', function() {
        view.champions();
    })

    .when('/champions/:id', function(params) {
        view.champion(store.champions.find(parseInt(params.id)));
    })*/


    .when('/items/all', function() {
        view.items(store.items);
    })

    .when('/items/:id', function(params) {
        var item = store.items.copy()
            .query({id:parseInt(params.id)})
            .merge(store.items, 'from')[0];

        view.item(item);
    })


    .when('/games/all', function() {
        var games = store.games
                .joinMany(mergedPlayers, 'players', 'game')
                .sort('end', 'desc');

        view.games(games);
    })

    .when('/games/:id', function(params) {
        var game = store.games
            .query({id:parseInt(params.id)})
            .joinMany(mergedPlayers, 'players', 'game')[0];

        view.game(game);
    })


    .when('/summoners/all', function() {
        view.summoners(store.summoners);
    })

    .when('/summoners/:id', function(params) {
        var champion,
            championCache = {},
            summoner = store.summoners.copy().find(parseInt(params.id));

        summoner.games = store.players.copy().query({summoner:summoner.id});
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
            summoner.stats[store.games.find(summoner.games[i].game).win ? 'wins' : 'losses'] += 1;

            champion = summoner.games[i].champion;
            if(champion in championCache) {
                summoner.champions[championCache[champion]].count += 1
            } else {
                championCache[champion] = summoner.champions.push({
                    name:store.champions.find(champion).name,
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
});
