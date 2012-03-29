define([
    'core/mediator'
], function(mediator) {

    var _modules = {};
    
    var app = {
        initialize: function(config) {
        
            var routingEngine,
                templatingEngine;

            if (config.templating) {
                templatingEngine = config.templating.engine;
                
                app.tmpl = {
                    renderView: templatingEngine.renderView
                };
                
                if (config.templating.defaultMaster) {
                    templatingEngine.registerMaster('default', config.templating.defaultMaster);
                }
                
                templatingEngine.initialize();
            }
            
            if (config.routing) {
                routingEngine = config.routing.engine;
                
                routingEngine.initialize();
            }
            
/*            if (config.logging) {
                var log = {};
                
                _.each(config.logging.severityLevels, function(_, severityLevel) {
                    log[severityLevel] = function(message) {
                        var timestamp = new Date(),
                            formattedMessage = config.logging.formatMessage(message, severityLevel, timestamp);
                        
                        config.logging.log(message, severityLevel, timestamp, formattedMessage);
                        console.log(formattedMessage);
                    };
                });
            
                if (config.logging.initialize) {
                    config.logging.initialize();
                }
                
                app.log = log;
            }*/
            
            
            // bind subscriptions
            
            _.each(_modules, function(moduleInfo) {
                moduleInfo.sandbox.bindSubscriptions(moduleInfo.module);
            });
            
            
            // apply directives
            
            _.each(_modules, function(moduleInfo, name) {
                _.each(moduleInfo.module, function(drArg, dr) {
                    var regex = /^!!(.*)\((.*)\)$/,
                        match = regex.exec(dr);
                        
                    if (match) {
                        var drName = match[1],
                            drArgs = match[2].replace(/\s/g, '').split(',');
                        
                        if (drName == "Application.extend") {
                            // extensions[drArgs[0]] = drArg;
                        } else if (drName == "Application.controller") {
                            _.each(drArg.routes, function(name, route) {
                                var callback = moduleInfo.module[name];
                                
                                routingEngine.route(route, name, function() {
                                    // app.context.start();
                                    callback.apply(moduleInfo.module, arguments);
                                });
                        
                            });
                            
                            _.each(drArg.templates, function(tmpl, name) {
                                templatingEngine.registerTemplate(name, tmpl);
                            });
                        }
                    }
                });
            });
        
            mediator.publish("Application.initialize");
            
            if (routingEngine) {
                routingEngine.start();
            }
            
            mediator.publish("Application.ready");
        }
    };
    
    app.sandbox = function(name) {
        return {
            publish: function(event, args) {
                mediator.publish(event, args);
            },
            subscribe: function(event, handler) {
                mediator.subscribe(event, handler);
            },
            bindSubscriptions: function(obj) {
                _.each(obj, function(fn, fnName) {
                    var regex = /^@((\w+)\.)?(\w+)$/,
                        match = regex.exec(fnName);
                        
                    if (match) {
                        if (typeof fn == 'function') {
                            var eventScope = match[2],
                                eventName = match[3],
                                fullEventName = (eventScope ? eventScope : name)
                                    + "." + eventName;
                            
                            mediator.subscribe(fullEventName, obj, fn);
                        } else {
                            // TODO: error
                        }
                    }
                });
                
                obj.publish = function(event, args) {
                    var fullEventName = /.*\..*$/.exec(event)
                        ? event
                        : name + '.' + event;

                    mediator.publish(fullEventName, args);
                };
                
                return obj;
            }
        };
    };
    
    var extend = function(name, ext, module) {
        _extensions[name] = {
            ext: ext,
            module: module
        };
    };
    
    app.core = {
    
        define: function(name, ctor) {
        
            // TODO: name checks
            
            var sandbox = app.sandbox(name),
                module = ctor(sandbox);
            
            module.ready = function() {
                mediator.publish(name + '.ready', [module]);
            };
            
            _modules[name] = {
                module: module,
                sandbox: sandbox,
            };
        
        }
    
    };
    
    return app;

});