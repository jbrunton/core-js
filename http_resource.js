define([
], function() {

    var HttpResource = function(collectionName) {
        this.collectionName = collectionName;
    };
    
    HttpResource.prototype.actionUrl = function(id) {
        return "/api/" + this.collectionName + (id ? "/" + id : "");
    };
    
    HttpResource.prototype.doReadCollectionReq = function(success, error) {
        var url = this.actionUrl();
        $.ajax({
            type: 'GET',
            url: url,
            success: success,
            error: error,
            dataType: 'json'
        });
    };
    
    HttpResource.prototype.doReadReq = function(id, success, error) {
        var url = this.actionUrl(id);
        $.ajax({
            type: 'GET',
            url: url,
            success: success,
            error: error,
            dataType: 'json'
        });
    };
    
    HttpResource.prototype.doPutReq = function(data, success, error) {
        var url = this.actionUrl(data.id);
        $.ajax({
            type: 'PUT',
            url: url,
            data: { data: data },
            success: success,
            error: error,
            dataType: 'json'
        });
    };
    
    HttpResource.prototype.doPostReq = function(data, success, error) {
        var url = this.actionUrl();
        $.ajax({
            type: 'POST',
            url: url,
            data: { data: data },
            success: success,
            error: error,
            dataType: 'json'
        });
    };
    
    return HttpResource;

});