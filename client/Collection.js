spider.define('Collection', function() {

    var Collection = {

        copy:function() {
            return this.create(JSON.parse(JSON.stringify(this)));
        },

        create:function() {
            var collection = Array.apply(Object.create(Array.prototype), Array.isArray(arguments[0]) ? arguments[0] : arguments);

            for(var method in Collection)
                collection[method] = Collection[method];
            
            return collection;
        },

        // Retrieve a single model by its id.
        find:function(id) {
            for(var i = 0; i < this.length; i++)
                if(this[i].id === id)
                    return this[i];

            return null;
        },

        // Perform a one-to-many join on a collection, returning a new collection.
        joinMany:function(collection, name, key) {
            var newCollection = this.copy();
                params = {};

            for(var i = 0; i < newCollection.length; i++) {
                params[key] = newCollection[i].id;
                newCollection[i][name] = collection.query(params);
            };

            return newCollection;
        },

        // Replace a non-primary index in each entry of the collection
        // with its value in another collection.
        merge:function(collection, key) {
            var newKey = key + 'Name';
            for(var i = 0; i < this.length; i++)
                this[i][newKey] = collection.find(this[i][key]).name;
            return this;
        },

        // Retrieve any models that match the parameters.
        // Creates and returns a new collection of those models.
        query:function(params) {
            // Since ids are unique, use find() for better performance when an id is supplied.
            if('id' in params)
                return this.create(this.find(params.id));

            // Since the collections are arrays, use filter() to return a new array
            // of models that match every key/value pair of the params argument.
            return this.create(this.filter(function(entry) {
                for(var key in params)
                    if(entry[key] !== params[key])
                        return false;

                return true;
            }));
        },
        
        sort:function(key, order) {
            var scale = (order === 'asc') ? -1 : 1;

            Array.prototype.sort.call(this, function(a, b) {
                return scale * (b[key] - a[key]);
            });

            return this;
        }
    };
    window.Collection = Collection;

    return Collection;

});
