define([], function() {

    var _channels = {};
        
    var subscribe = function() {
        var eventName = arguments[0],
            eventHandler,
            context,
            constArgs;
        
        if (typeof arguments[1] == "function") {
            eventHandler = arguments[1];
            constArgs = arguments[2];
            context = this;
        } else if (typeof arguments[1] == "object") {
            context = arguments[1];
            eventHandler = arguments[2];
            constArgs = arguments[3];
        }
        
        var handler = function() {
            return eventHandler.apply(context, constArgs || arguments);
        }
        
        if (!_channels[eventName]) {
            _channels[eventName] = [];
        }
        
        _channels[eventName].push(handler);
    };
    
    var publish = function(eventName, args) {
        console.log(eventName + " published");
        _.each(_channels, function(handlers, channelName) {
            if (channelName == eventName) {
                _.each(handlers, function(handler) {
                    handler.apply({}, args || []);
                });
            }
        });
    };
    
    return {
        subscribe: subscribe,
        publish: publish
    };
});