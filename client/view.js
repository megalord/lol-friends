spider.define('view', function() {

    var main = document.querySelector('main'),

    backButton = function() {
        var back = createElement('div', 'back', {class:'center'});
        back.addEventListener('click', function() { window.history.back(); });
        return back;
    },

    createElement = function(tagName, content, attributes) {
        var element = tagName === 'fragment' ? document.createDocumentFragment() : document.createElement(tagName);

        if(typeof attributes === 'object')
            for(var attr in attributes)
                element.setAttribute(attr, attributes[attr]);

        if(typeof content === 'undefined' || content === null)
            return element;
        else if(typeof content === 'string')
            element.textContent = content;
        else if(typeof content.nodeType !== 'undefined')
            element.appendChild(content);
        else if(Array.isArray(content))
            for(var i = 0; i < content.length; i++)
                element.appendChild(content[i]);

        return element;
    },

    divider = function() {
        return createElement('img', null, {class:'divider',src:'/images/divider.png'});
    },

    gamePreview = function(game) {
        var player, preview,
            fragment = createElement('fragment');

        for(var i = 0; i < game.players.length; i++) {
            player = game.players[i];
            fragment.appendChild(createElement('div', [
                createElement('span', player.summonerName, {class:'left'}),
                createElement('span', player.championName),
                createElement('span', player.kills + '/' + player.deaths + '/' + player.assists, {class:'right'})
            ], {class:'center'}));
        };

        preview = createElement('div', [
            gameTitle(game),
            fragment,
            divider()
        ]);
        navigateOnClick(preview, '/games/' + game.id);

        return preview;
    },

    gameTitle = function(game) {
        return createElement('div', [
            createElement('span', game.type, {class:'left'}),
            createElement('span', game.win ? 'victory' : 'defeat'),
            createElement('span', formatDate(game.start), {class:'right'})
        ], {class:'center'});
    },

    formatDate = function(t) {
        var date = new Date(t),
            hour = date.getHours(),
            meridiem = hour > 11 ? 'pm' : 'am',
            min = date.getMinutes().toString();

        if(hour > 12)
            hour -= 12;
        if(hour === 0)
            hour += 12;
        
        if(min.length === 1)
            min = '0' + min;

        return (date.getMonth()+1) + '-' + date.getDate() + ' ' + hour + ':' + min + meridiem;
    },

    navigateOnClick = function(element, route) {
        element.addEventListener('click', function() {
            diesel.router.navigateTo(route);
        });
    },
    
    render = function(element) {
        main.innerHTML = '';
        main.appendChild(element);
    };

    navigateOnClick(document.querySelector('h1'), '/');

    return {
        allGames:function(games) {
            var fragment = createElement('fragment');

            for(var i = 0; i < games.length; i++)
                fragment.appendChild(gamePreview(games[i]));

            render(fragment);
        },

        game:function(game) {
            var createRow = function(text) {
                var cells = [];
                for(var i = 0; i < text.length; i++)
                    cells.push(createElement('td', text[i]));
                return createElement('tr', cells);
            },
            
            rows = [createRow(['summoner', 'champion', 'k/d/a', 'cs', 'gold'])];

            for(var i = 0; i < game.players.length; i++) {
                summoner = createElement('div', game.players[i].summonerName);
                navigateOnClick(summoner, '/summoners/' + game.players[i].summoner);
                rows.push(createRow([
                    summoner,
                    game.players[i].championName,
                    game.players[i].kills+'/'+game.players[i].deaths+'/'+game.players[i].assists,
                    game.players[i].minions.toString(),
                    Math.round(game.players[i].gold/100)/10 + 'k'
                ]))
            };

            render(createElement('fragment', [
                gameTitle(game),
                createElement('table', rows),
                backButton()
            ]));
        },

        home:function() {
            var gamesLink = createElement('span', 'games'),
                summonersLink = createElement('span', 'summoners');

            navigateOnClick(gamesLink, '/games/all');
            navigateOnClick(summonersLink, '/summoners/all');

            render(createElement('fragment', [
                createElement('div', 'browse by:', {class:'center'}),
                createElement('div', [
                    gamesLink,
                    createElement('span', null, {id:'spacer'}),
                    summonersLink
                ], {id:'links', class:'center'})
            ]));
        },

        summoner:function(summoner) {
            var createRow = function(col1, col2) {
                if(typeof col2 !== 'string')
                    return createElement('tr', createElement('td', col1, {class:'center',colspan:2}));

                return createElement('tr', [
                    createElement('td', col1, {class:'leftpad'}),
                    createElement('td', col2)
                ]);
            },
            
            rows = [
                createElement('caption', createElement('h4', 'Stats for ' + summoner.name)),
                createRow('Record '+summoner.stats.wins+'-'+summoner.stats.losses),
                createRow(divider()),
                createRow('Per game averages'),
                createRow([summoner.stats.kills, summoner.stats.deaths, summoner.stats.assists].join('/')),
                createRow('minions', summoner.stats.minions.toString()),
                createRow('gold', Math.round(summoner.stats.gold/100)/10 + 'k'),
                createRow(divider()),
                createRow('Champions played')
            ];

            for(var i = 0; i < summoner.champions.length; i++)
                rows.push(createRow(summoner.champions[i].name, summoner.champions[i].count.toString()));
                
            render(createElement('fragment', [
                createElement('table', rows),
                divider(),
                backButton()
            ]));
        },

        summoners:function(summoners) {
            var link,
                list = createElement('ul', null, {class:'center'});

            for(var i = 0; i < summoners.length; i++) {
                link = createElement('li', summoners[i].name);
                navigateOnClick(link, '/summoners/' + summoners[i].id);
                list.appendChild(link);
            };

            render(list);
        }
    };

});
