define([], function() {

    var _channels = {},
        _waits = [];
        
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
        
        _.each(_waits, function(wait) {
            _.each(wait.events, function(event) {
                if (event.name == eventName) {
                    event.published = true;
                }
            });
            
            var active = !_.all(wait.events, function(event) {
                return event.published;
            });
            
            if (!active) {
                wait.active = false;
                wait.handler();
            }
        });
        
        _waits = _.filter(_waits, function(wait) {
            return wait.active;
        });
    };
    
    var when = function(events, handler) {
        _waits.push({
            active: true,
            events: _.map(events, function(eventName) {
                return { name: eventName, published: false };
            }),
            handler: handler
        });
    };
    
    return {
        subscribe: subscribe,
        publish: publish,
        when: when
    };
});