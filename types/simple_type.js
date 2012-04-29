define([], function() {

    var SimpleType = function(type_name, serialize, deserialize) {
        this.type_name = type_name;

        this.serialize = serialize
            ? serialize
            : _.identity;

        this.deserialize = deserialize
            ? deserialize
            : _.identity;
            
        this.is_resource = false;
    };
    
    return SimpleType;

});