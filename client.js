(function() {

    var fragment = document.createDocumentFragment(),
        listElement = document.getElementById('list'),

        store = {},

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

    createGameDescription = function(game, summoner) {
        var players,
            fragment = createElement('fragment'),
            params = {game:game.id};

        if(summoner !== 0)
            params.summoner = summoner;
            
        players = query('players', params);

        for(var i = 0; i < players.length; i++) {
            fragment.appendChild(createElement('div', [
                createElement('span', find('summoners', players[i].summoner).name, {class:'left'}),
                createElement('span', find('champions', players[i].champion).name),
                createElement('span', players[i].kills + '/' + players[i].deaths + '/' + players[i].assists, {class:'right'})
            ], {class:'center'}));
        };

        return createElement('li', [
            createElement('div', [
                createElement('span', game.type),
                createElement('span', formatDate(game.start), {class:'right'})
            ]),
            fragment,
            createElement('img', null, {class:'divider',src:'divider.png'})
        ]);
    },

    getJSON = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if(xhr.status === 200)
                    callback(JSON.parse(xhr.responseText));
                else
                    callback('error');
            };
        };
        xhr.open('GET', '/players');
        xhr.send();
    },

    find = function(collectionName, id) {
        var collection = store[collectionName];

        for(var i = 0; i < collection.length; i++)
            if(collection[i].id === id)
                return collection[i];

        return null;
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
    
    render = function(summoner) {
        var players,
            games = [],
            fragment = document.createDocumentFragment();

        // Filter the collection of games using the summoner of interest.
        if(summoner === 0) {
            games = store.games;
        } else {
            players = query('players', {summoner:summoner});
            for(var i = 0; i < players.length; i++)
                games.push(find('games', players[i].game));
        };

        // Sort the games descending by date.
        games.sort(function(a, b) {
            return b.start - a.start;
        });

        // Create a html element to describe each game.
        for(var i = 0; i < games.length; i++)
            fragment.appendChild(createGameDescription(games[i], summoner));

        // Erase the old list, and add the new elements to the DOM.
        listElement.innerHTML = '';
        listElement.appendChild(fragment);
    },

    query = function(collectionName, params) {
        return store[collectionName].filter(function(entry) {
            var doesMatch = true;
            for(var key in params) {
                if(entry[key] !== params[key]) {
                    doesMatch = false;
                    break;
                };
            };
            return doesMatch;
        });
    };


    // Add the event listener for the summoner select.
    document.getElementById('summoner').addEventListener('change', function(event) {
        render(parseInt(event.target.value));
    });


    // Initialize the app.
    store = window.prerender;
    delete window.prerender;

    for(var i = 0; i < store.summoners.length; i++) {
        option = createElement('option', store.summoners[i].name);
        option.value = store.summoners[i].id;
        fragment.appendChild(option);
    };

    document.getElementById('summoner').appendChild(fragment);

    render(0);
})();
