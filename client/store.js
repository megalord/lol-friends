spider.define('store', function() {
    
    var store,

    clone = function(data) {
        return JSON.parse(JSON.stringify(data));
    };

    // Get the store data, which is injected into the index page.
    store = window.prerender;
    delete window.prerender;

    // Retrieve a single model by its id.
    store.find = function(collectionName, id) {
        var collection = store[collectionName];

        for(var i = 0; i < collection.length; i++)
            if(collection[i].id === id)
                return collection[i];

        return null;
    };

    store.join = function(collectionAName, collectionBName, params) {
        var collections = [{
                name:collectionAName,
                data:clone(store[collectionAName])
            }, {
                name:collectionBName,
                data:clone(store[collectionBName])
            }],
            key = collections[0].name.slice(0, -1);

        // Make sure that the two collections are in the right order.
        // The first collection 
        if(!(key in collections[1].data)) {
            collections.reverse();
            key = collections[0].name.slice(0, -1);
        };

        for(var i = 0; i < collections[0].length; i++) {
            newData = store.find(collections[1].name, collections[1][key])
            for(var key in newData) {
                collection[((key in collections[1-target].data[0]) ? collections[target].name : '') + key] = newData[key]
            };
        };

    };

    // Retrieve any models that match the parameters.
    store.query = function(collectionName, params) {
        // Since ids are unique, use find() for better performance when an id is supplied.
        if('id' in params)
            return [this.find(collectionName, params.id)];

        // Since the collections are arrays, use filter() to return a new array
        // of models that match every key/value pair of the params argument.
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
