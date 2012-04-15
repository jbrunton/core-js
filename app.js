define([
    'core/mediator',
    'core/components/resources'
], function(mediator, resourcesComponent) {

    var _modules = {},
        _extenders = {};
    
    var _urlMap = {};
    
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
                
            if (config.resources) {
                typesModule = _modules['TypesModule'].module;
                resourcesComponent.initialize(config, typesModule);
                app.resources = resourcesComponent.facade();
            }

            if (config.templating) {
                templatingModule = _modules[config.templating.module].module;
                
                if (config.templating.defaultMaster) {
                    templatingModule.registerTemplate(
                        config.templating.defaultMaster.name,
                        config.templating.defaultMaster.template
                    );
                }
                
                function renderPage() {
                    templatingModule.clearBindings();
                    templatingModule.bind(config.templating.defaultBindings);
                    
                    if (arguments.length > 0) {
                        if (typeof arguments[0] == 'object') {
                            templatingModule.bind(arguments[0]);
                        } else if (typeof arguments[0] == 'string') {
                            var bindings = {};
                            bindings[config.templating.defaultSection] = {
                                name: arguments[0],
                                data: arguments.length > 1 ? arguments[1] : null
                            };
                            templatingModule.bind(bindings);
                        }
                    }
                    
                    templatingModule.renderPage(config.templating.defaultMaster.name);
                }
                
                function defaultBindings(bindings) {
                    config.templating.defaultBindings = bindings;
                }
                
                app.tmpl = {
                    bind: templatingModule.bind,
                    defaultBindings: defaultBindings,
                    renderPage: renderPage
                };
            }
            
            if (config.routing) {
                app.context = new Context();
                
                routingModule = _modules[config.routing.module].module;
                
                function urlFor(obj, action) {
                    if (!action) {
                        action = 'view';
                    }
                    return _urlMap[obj.type_name](obj, action);
                }
                
                app.nav = {
                    to: routingModule.navigate,
                    urlFor: urlFor
                };
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
                        } else if (drName == "Application.mapResource") {
                            _.extend(_urlMap, drArg);
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
        
        },
        
        defineExtender: function(name, extr) {
            _extenders[name] = extr;
        },
        
        extend: function(obj, extns) {
            _.each(extns, function(defn, extName) {
                _extenders[extName].apply(obj, defn);
            });
        }
    
    };
    
    //app.core.define('TypesModule', function(sandbox) {
    //    return typesModule;
    //});
    
    return app;

});