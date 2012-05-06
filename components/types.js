define([
    '../http_resource',
    '../types/simple_type',
    '../types/complex_type',
    '../types/environment'
], function(HttpResource, SimpleType, ComplexType, Environment) {

    // simple type definitions
    
    var formatDate = function(date) {
        return date ? date.toString() : null;
    };

    var parseDate = function(value) {
        // 2012-03-15T23:02:29Z
        var regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;

        if (value) {
            var match = value.match(regex);
            return new Date(
                parseInt(match[1]),
                parseInt(match[2]),
                parseInt(match[3]),
                parseInt(match[4]),
                parseInt(match[5]),
                parseInt(match[6]));
        } else {
            return null;
        }
    };

    

    var typesComponent = {
        initialize: function() {
            var env = new Environment();
            
            env.registerSimpleType("integer");
            env.registerSimpleType("string");
            env.registerSimpleType("datetime", formatDate, parseDate);
            
            // TODO: can we make list types more fundamental to the algorithm?  serialization logic
            // is a bit divided with this up here.
            env.registerSimpleType("list", function(arr, itemTy) {
                    return arr;
                }, function(arr, itemTy) {
                    return _.map(arr, function(x) {
                        return itemTy.deserialize(x);
                    });
                }
            );
            
            return {
                registerSimpleType: function(type_name, serialize, deserialize) {
                    env.registerSimpleType(type_name, serialize, deserialize);
                },
                
                registerComplexType: function(typeDesc) {
                    env.registerComplexType(typeDesc);
                },
                
                locateResource: function(typeName) {
                    return env.getResource(typeName);
                },
                
                newResource: function(typeName, data) {
                    return new (env.getResource(typeName))(data);
                },
            
                registerResource: function(params) {
                    env.registerResource(params);
                }
            };
        }
    };
    
    return typesComponent;
});