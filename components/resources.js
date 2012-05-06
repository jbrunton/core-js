define([
], function() {

    var component = {
        initialize: function(config, typesComponent) {
            _.each(config.resources.resources, function(resource) {
                typesComponent.registerResource(resource);
            });
            
            return {
                locate: typesComponent.locateResource,
                new: typesComponent.newResource
            };            
        }
    };
    
    return component;

});