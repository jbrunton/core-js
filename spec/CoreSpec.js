define(['../app'], function (app) {
  
    describe('app.core', function () {
  
        var module = app.core.define('FooModule', function(sandbox) {
            return {
                foo: function() {
                    this.publish('foo');
                },
                
                "@Application.initialize": function(app) {
                    this.ready();
                },
                
                "@FooModule.foo": function(module) {
                    // AER impl. currently doesn't work with jasmine spies, so
                    // it's necessary to call another method to expect the call for
                    // TODO: but why does the test for @Application.initialize appear to work?
                    this.fooHandler();
                },
                
                fooHandler: function() {
                }
            };
        });
          
        it ('should define a module', function () {    
            expect(module).toBeTruthy();
        });
        
        it ('should initialize defined modules', function() {
            spyOn(module, "@Application.initialize");
            
            app.initialize({
            });
            
            expect(module["@Application.initialize"]).toHaveBeenCalled();
        });
        
        it ('should register event handlers', function() {
            spyOn(module, "fooHandler");
            
            module.foo();
            
            expect(module["fooHandler"]).toHaveBeenCalled();
        });
    
    });
  
});