define([], function() {

    var ComplexType = function(typeDesc, env) {
        this.type_name = typeDesc.type_name;
        
        this.serialize = function(obj, options) {
            var data = {};
            
            var recursive = !options || options.recursive;
    
            _.each(typeDesc.properties, function(propInfo, propName) {
                var propType = env.getType(propInfo.type_name);
                // TODO: check for associations - maybe build into type info
                var resTy = !_.isUndefined(env.getResource(propType.type_name))
                    || (propType.type_name == 'list' && !_.isUndefined(env.getResource(propInfo.item_type)));
                if (!resTy || recursive) {
                    var propValue = obj[propName]();
                    if (!_.isNull(propValue)) {
                        console.log("propName: " + propName + ", propValue: " + propValue + ", _.isNull(propValue): false");
                        data[propName] = propType.serialize(propValue);
                    } else {
                        console.log("propName: " + propName + ", propValue: " + propValue + ", _.isNull(propValue): true");
                    }
                } else {
                    console.log("not recursively serializing " + propName);
                }
            });
    
            return data;
        };
        
        this.deserialize = function(data, target) {
            if (!data) {
                return null;
            }
            if (!target) {
                if (env.getResource(typeDesc.type_name)) {
                    target = new (env.getResource(typeDesc.type_name));
                } else {
                    target = {};
                }
            }
            _.each(typeDesc.properties, function(propInfo, propName) {
                // TODO: error checking on the property type name (check it exists!)
                var tyName = typeDesc.properties[propName].type_name,
                    propType = env.getType(tyName);
                if (tyName == "list") {
                    var itemTyName = typeDesc.properties[propName].item_type,
                        itemTy = env.getType(itemTyName);
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
    
    return ComplexType;
});