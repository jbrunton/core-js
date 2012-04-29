define([], function () {
  
    var MyViewModel = function() {
        this.content = ko.observable();
        
        var self = this;

        this.doRequest = function() {
            $.get('http://search.twitter.com/search.json?q=blue%20angels&rpp=5&include_entities=true&result_type=mixed', function(data) {
                self.content(data);
            });
        };
    };
  
    describe('MyViewModel', function () {
 
        var myViewModel = new MyViewModel();
 
        it ('should have no content when created', function () {    
            expect(myViewModel.content()).toBeFalsy();
        });
        
        it ('should load content from Google', function() {
            myViewModel.doRequest();
            
            waitsFor(function() {
                return myViewModel.content();
            });
            
            expect(myViewModel.content()).toBeTruthy();
        });
    
    });
  
});