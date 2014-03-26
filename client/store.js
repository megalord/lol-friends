spider.define('store', function() {
    
    var store = {},

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
    };

    store = window.prerender;
    delete window.prerender;

    store.find = function(collectionName, id) {
        var collection = store[collectionName];

        for(var i = 0; i < collection.length; i++)
            if(collection[i].id === id)
                return collection[i];

        return null;
    };

    store.query = function(collectionName, params) {
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

    return store;

});
