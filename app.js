define([
    'core/mediator',
    'core/modules/types_module'
], function(mediator, typesModule) {

    var _modules = {};
    
    var Context = function() {
        this.currentState = this.activeState = {};
    };
    
    Context.prototype.push = function(name, value) {
        this.activeState[name] = value;
    };
    
    Context.prototype.start = function() {
        this.currentState = this.activeState;
        this.activeState = {};
        this.push('History.prevUrl', Backbone.history.fragment);
    };
    
    Context.prototype.peek = function(name) {
        return this.currentState[name];
    };
    
    var app = {
        initialize: function(config) {
        
            var modulesReady = function() {
                return _.all(_modules, function(x) {
                    return x.ready;
                });
            };
            
            var maybeReady = function(module) {
                if (modulesReady()) {
                    console.log("Application ready");
                    mediator.publish('Application.ready', [app]);
                }
            };
    
            var routingModule,
                templatingModule,
                authModule,
                typesModule;
                
            typesModule = _modules['TypesModule'].module;

            /*if (config.resources) {            
                app.resources = {
                    locate: typesModule.locateResource
                };
                
                _.each(config.resources.resources, function(resource) {
                    typesModule.registerResource(resource);
                });
            }*/

            if (config.templating) {
                templatingModule = _modules[config.templating.module].module;
                
                app.tmpl = {
                    renderView: templatingModule.renderView
                };
                
                if (config.templating.defaultMaster) {
                    templatingModule.registerMaster('default', config.templating.defaultMaster);
                }
            }
            
            if (config.routing) {
                app.context = new Context();
                routingModule = _modules[config.routing.module].module;
            }
            
            if (config.auth) {
                authModule = _modules[config.auth.module].module;
                
                var signin = function(username, password, success) {
                    authModule.signin(username, password, success);
                };
                
                var signout = function() {
                    authModule.signout();
                };
                
                var currentUser = function() {
                    return authModule.currentUser();
                };

                app.auth = {
                    signin: signin,
                    signout: signout,
                    currentUser: currentUser
                };
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
            
            _.each(_modules, function(moduleInfo, moduleName) {
                moduleInfo.sandbox.bindSubscriptions(moduleInfo.module);
                
                mediator.subscribe(moduleName + ".ready", function() {
                    _modules[moduleName].ready = true;
                    maybeReady();
                });
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
                                
                                routingModule.route(route, name, function() {
                                    app.context.start();
                                    callback.apply(moduleInfo.module, arguments);
                                });
                        
                            });
                            
                            _.each(drArg.templates, function(tmpl, name) {
                                templatingModule.registerTemplate(name, tmpl);
                            });
                        }
                    }
                });
            });
        
            mediator.publish("Application.initialize");
            
            
            
            // mediator.publish("Application.ready");
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
    
    app.core.define('TypesModule', function(sandbox) {
        return typesModule;
    });
    
    return app;

});