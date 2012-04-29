define(['core/mediator'], function (mediator) {
    
    describe('Mediator', function() {

        it ('should publish events', function() {
            
            var handlerCalled = false;
            
            var handler = function() {
                handlerCalled = true;
            };
            
            mediator.subscribe('foo', handler);
            mediator.publish('foo');
            
            expect(handlerCalled).toBeTruthy();
            
        });
        
        it ('can wait() for multiple async events', function() {
            
            var handlerCalled = false;
            
            var handler = function() {
                handlerCalled = true;
            };
            
            mediator.when(['foo', 'bar'], handler);
            
            mediator.publish('foo');
            
            expect(handlerCalled).toBeFalsy();
            
            mediator.publish('bar');
            
            expect(handlerCalled).toBeTruthy();
            
        });
    });
  
});