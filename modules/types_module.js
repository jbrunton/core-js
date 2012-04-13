define([
    'core/app',
    'core/http_resource'
], function(app, HttpResource) {

    var _types = {},
        _resources = {};
    
    var SimpleType = function(type_name, serialize, deserialize) {
        this.type_name = type_name;

        this.serialize = serialize
            ? serialize
            : _.identity;

        this.deserialize = deserialize
            ? deserialize
            : _.identity;
    };
    
    var ComplexType = function(typeDesc) {
        this.type_name = typeDesc.type_name;
        
        this.serialize = function(obj, options) {
            var data = {};
            
            var recursive = !options || options.recursive;
    
            _.each(typeDesc.properties, function(propInfo, propName) {
                var propType = _types[propInfo.type_name];
                // TODO: check for associations - maybe build into type info
                var resTy = !_.isUndefined(_resources[propType.type_name])
                    || (propType.type_name == 'list' && !_.isUndefined(_resources[propInfo.item_type]));
                if (!resTy || recursive) {
                    var propValue = obj[propName]();
                    data[propName] = propType.serialize(propValue);
                } else {
                    console.log("not recursively serializing " + propName);
                }
            });
    
            return data;
        };
        
        this.deserialize = function(data, target) {
            if (!target) {
                if (_resources[typeDesc.type_name]) {
                    target = new _resources[typeDesc.type_name];
                } else {
                    target = {};
                }
            }
            _.each(typeDesc.properties, function(propInfo, propName) {
                var tyName = typeDesc.properties[propName].type_name,
                    propType = _types[tyName];
                if (tyName == "list") {
                    var itemTyName = typeDesc.properties[propName].item_type,
                        itemTy = _types[itemTyName];
                }
                if (propType) {
                    var propValue = propType.deserialize(data[propName], itemTy);
                    if (target[propName]) {
                        target[propName](propValue);
                    } else {
                        if (tyName == "list") {
                            target[propName] = ko.observableArray(propValue);
                        } else {
                            target[propName] = ko.observable(propValue);
                        }
                    }
                } else {
                    // TODO: error/logging
                }
            });
            return target;
        };
    };
    
    var serialize = function(obj, options) {
        var objTy = _types[obj.type_name];
        var data = objTy.serialize(obj, options);
        return data;
    };
    
    var deserialize = function(data, obj) {
        var objTy = _types[data.type_name || obj.type_name];
        var obj = objTy.deserialize(data, obj);
        return obj;
    };
        
    var registerType = function(type) {
        if (_types[type]) {
            throw new Error("type " + type + " already exists.");
        }
        
        _types[type.type_name] = type;
    };
    
    app.core.define('TypesModule', function(sandbox) {
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
                registerType(new SimpleType(type_name, serialize, deserialize));
            },
            
            registerComplexType: function(typeDesc) {
                registerType(new ComplexType(typeDesc));
            },
            
            locateResource: function(typeName) {
                return _resources[typeName];
            },
        
            registerResource: function(params) {
                var objCtor = params.objCtor,
                    typeName = params.typeName,
                    collectionName = params.collectionName;
                    
                if (!objCtor) {
                    objCtor = function(data) {
                        this.deserialize(data || {});
                    };
                }
                    
                _resources[typeName] = objCtor;
        
                var httpResource = new HttpResource(collectionName);
                
                objCtor.prototype.type_name = typeName;
                
                objCtor.prototype.serialize = function() {
                    return serialize(this);
                };
            
                objCtor.prototype.deserialize = function(data) {
                    deserialize(data, this);
                    return this;
                };
                
                objCtor.prototype.load = function(id) {
                    var self = this;
                    
                    this.id(id);
                    
                    httpResource.doReadReq(id, function(data) {
                        deserialize(data, self);
                    });
                    
                    return this;
                };
                
                objCtor.prototype.save = function(success, options) {
                    var self = this;
                    
                    var data = serialize(this, options);
                    if (this.id() > 0) {
                        httpResource.doPutReq(data, function(data) {
                            deserialize(data, self);
                            if (success) {
                                success(self);
                            }
                        });
                    } else {
                        httpResource.doPostReq(data, function(data) {
                            deserialize(data, self);
                            if (success) {
                                success(self);
                            }
                        });
                    }
                    
                    return this;
                };
                
                objCtor.load = function(id, success, error) {
                    var self = this;
                    
                    httpResource.doReadReq(id, function(data) {
                        var obj = new objCtor();
                        obj.deserialize(data);
                        success(obj);
                    });
                };
                
                objCtor.loadCollection = function(reqOptions, success, error) {
                    var self = this;
                    
                    httpResource.doReadCollectionReq(function(collectionData) {
                        var collection = _.map(collectionData, function(data) {
                            var obj = new objCtor();
                            obj.deserialize(data);
                            return obj;
                        });
                        if (success) {
                            success(collection);
                        }
                    }, null, reqOptions);
                };
            }
        };
    
        return module;
    });
});