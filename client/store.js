spider.define('store', function() {

    var Collection = spider.fetch('Collection'),
    
        store = {},

    // Get the store data, which is injected into the index page.
    data = window.prerender;
    delete window.prerender;

    for(var collectionName in data)
        store[collectionName] = Collection.create(data[collectionName]);

    return store;

});
