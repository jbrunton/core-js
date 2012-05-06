define([
    '../app',
    './simple_type',
    './complex_type',
    '../http_resource'
], function(app, SimpleType, ComplexType, HttpResource) {

    var Environment = function() {
        var _types = {},
            _resources = {},
            _extenders = {};
    
        function registerType(type) {
            if (_types[type.type_name]) {
                throw new Error("type " + type + " already exists.");
            }
            
            _types[type.type_name] = type;
        };
        
        this.serialize = function(obj, options) {
            var objTy = this.getType(obj.type_name);
            var data = objTy.serialize(obj, options);
            return data;
        };
        
        this.deserialize = function(data, obj) {
            var objTy = this.getType(data.type_name || obj.type_name);
            var obj = objTy.deserialize(data, obj);
            return obj;
        };

        this.registerSimpleType = function(type_name, serialize, deserialize) {
            registerType(new SimpleType(type_name, serialize, deserialize));
        };
        
        this.registerComplexType = function(typeDesc) {
            registerType(new ComplexType(typeDesc, this));
        };
        
        this.getType = function(type_name) {
            return _types[type_name];
        };
        
        this.getResource = function(type_name) {
            return _resources[type_name];
        };
        
        this.defineExtender = function(name, extr) {
            _extenders[name] = extr;
        };
        
        this.extend = function(obj, extns) {
            _.each(extns, function(defn, extName) {
                _extenders[extName].apply(obj, defn);
            });
        };
        
        this.registerResource = function(params) {
            var env = this;
            
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
                return env.serialize(this);
            };
        
            objCtor.prototype.deserialize = function(data) {
                env.deserialize(data, this);
                return this;
            };
            
            var applyExtensions = function(obj, opts) {
                env.extend(obj, opts.extensions);
                
                if (opts.includes) {
                    _.each(obj.includes, function(fieldOpts, fieldName) {
                        env.extend(obj[fieldName], fieldOpts);
                    });
                }
            };
            
            objCtor.prototype.load = function(id, reqOpts) {
                var self = this;
                
                this.id(id);
                
                httpResource.doReadReq(id, function(data) {
                    env.deserialize(data, self);
                }, null, reqOpts);
                
                applyExtensions(self, reqOpts);
                
                return this;
            };
            
            objCtor.prototype.save = function(success, options) {
                var self = this;
                
                var data = env.serialize(this, options);
                if (this.id() > 0) {
                    httpResource.doPutReq(data, function(data) {
                        env.deserialize(data, self);
                        if (success) {
                            success(self);
                        }
                    });
                } else {
                    httpResource.doPostReq(data, function(data) {
                        env.deserialize(data, self);
                        if (success) {
                            success(self);
                        }
                    });
                }
                
                return this;
            };
            
            objCtor.load = function(id, success, error, reqOpts) {
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
        };

    };
    
    return Environment;

});