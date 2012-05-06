define([
    'core/types/simple_type',
    'core/types/complex_type'
], function(SimpleType, ComplexType) {

    var Environment = function() {
        var _types = [],
            _resources = [];
    
        function registerType(type) {
            if (_types[type.type_name]) {
                throw new Error("type " + type + " already exists.");
            }
            
            _types[type.type_name] = type;
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
        
        this.registerResource = function(params) {
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
            
            var applyExtensions = function(obj, opts) {
                app.core.extend(obj, opts.extensions);
                
                if (opts.includes) {
                    _.each(obj.includes, function(fieldOpts, fieldName) {
                        app.core.extend(obj[fieldName], fieldOpts);
                    });
                }
            };
            
            objCtor.prototype.load = function(id, reqOpts) {
                var self = this;
                
                this.id(id);
                
                httpResource.doReadReq(id, function(data) {
                    deserialize(data, self);
                }, null, reqOpts);
                
                applyExtensions(self, reqOpts);
                
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