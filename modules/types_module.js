define([
    '../app',
    '../http_resource',
    '../types/simple_type',
    '../types/complex_type',
    '../types/environment'
], function(app, HttpResource, SimpleType, ComplexType, Environment) {


        
    /*var registerType = function(type) {
        if (_types[type]) {
            throw new Error("type " + type + " already exists.");
        }
        
        _types[type.type_name] = type;
    };*/
    
    app.core.define('TypesModule', function(sandbox) {
        
        var env = new Environment();
    
        var module = {
            "@Application.initialize": function(app) {
                var self = this;
                
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
                
                this.registerSimpleType("integer");
                this.registerSimpleType("string");
                this.registerSimpleType("datetime", formatDate, parseDate);
                this.registerSimpleType("list", function(arr, itemTy) {
                    return arr;
                }, function(arr, itemTy) {
                    return _.map(arr, function(x) {
                        return itemTy.deserialize(x);
                    });
                });
                // this.registerSimpleType("date", formatDate, parseDate);
                
                var typesResource = new HttpResource("meta/types");
                typesResource.doReadCollectionReq(function(data) {
                    _.each(data, function(typeDesc) {
                        self.registerComplexType(typeDesc);
                    });
                    
                    self.publish("ready", [self]);
                });
            },
    
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
    
        return module;
    });
});