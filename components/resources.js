define([
], function() {

    var _typesModule;

    var component = {
        initialize: function(config, typesModule) {
            _typesModule = typesModule;
            _.each(config.resources.resources, function(resource) {
                typesModule.registerResource(resource);
            });
        },
        
        facade: function() {
            return {
                locate: _typesModule.locateResource
            };
        }
    };
    
    return component;

});