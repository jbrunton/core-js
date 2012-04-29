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
        
        this.registerSimpleType("list",
            function(arr, itemTy) {
                return arr;
            },
            function(arr, itemTy) {
                return _.map(arr, function(x) {
                    return itemTy.deserialize(x);
                });
            }
        );

    };
    
    return Environment;

});