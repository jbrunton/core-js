define([
], function() {

    var HttpResource = function(collectionName) {
        this.collectionName = collectionName;
    };
    
    var genReqParams = function(opts) {
        var str;
        
        var doRec = function(opts, scope) {
            _.each(opts.includes, function(x,f) {
            
                if (x.includes) {                        
                    doRec(x, f);
                } else {
                    if (str) {
                        str += ",";
                    } else {
                        str = "includes=";
                    }
                    
                    str += (scope ? scope + "." : "") + f;
                }
            });
        };
        
        doRec(opts);
        
        return str;
    };
    
    HttpResource.prototype.actionUrl = function(id, reqOpts) {
        var url = "/api/" + this.collectionName + (id ? "/" + id : "");
        
        if (reqOpts) {
            var queryStr = genReqParams(reqOpts);
            if (queryStr) {
                url += "?" + queryStr;
            }
        }
        return url;
    };
    
    HttpResource.prototype.doReadCollectionReq = function(success, error, opts) {
        var url = (opts && opts.url) ? opts.url : this.actionUrl();
        $.ajax({
            type: 'GET',
            url: url,
            success: success,
            error: error,
            dataType: 'json'
        });
    };
    
    HttpResource.prototype.doReadReq = function(id, success, error, reqOpts) {
        var url = this.actionUrl(id, reqOpts);
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