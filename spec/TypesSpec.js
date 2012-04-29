define([
    'core/types/simple_type',
    'core/types/environment',
    'core/types/complex_type'
], function (SimpleType, Environment, ComplexType) {
    
    describe('SimpleType', function() {

        it ('should serialize/deserialize according to constructor args, if provided', function() {
            
            var myType = new SimpleType('my_type',
                function(x) { return 1; },
                function(y) { return 2; });
            
            expect(myType.serialize).toBeDefined();
            expect(myType.deserialize).toBeDefined();
            
            expect(myType.serialize(2)).toEqual(1);
            expect(myType.deserialize(1)).toEqual(2);
            
        });

        it ('should serialize/deserialize with the identity, otherwise', function() {
            
            var myType = new SimpleType('my_type');
            
            expect(myType.serialize).toBeDefined();
            expect(myType.deserialize).toBeDefined();
            
            expect(myType.serialize(1)).toEqual(1);
            expect(myType.deserialize(1)).toEqual(1);
            
        });
    });
    
    var env = new Environment();
    
    describe('Environment', function() {
        
        it ('should allow registration and lookup of simple types', function() {
            env.registerSimpleType('my_type');
            expect(env.getType('my_type')).toBeTruthy();
        });
        
        it ('should ensure uniqueness of registered type names', function() {
            expect(function() { env.registerSimpleType('my_type'); }).toThrow();
        });
        
        it ('should allow registration and lookup of complex types', function() {
            env.registerComplexType({
                type_name: 'foo_type',
                properties: {
                    foo: { type_name: 'my_type' }
                }
            });
            expect(env.getType('foo_type')).toBeTruthy();
        });
    });
    
    describe('ComplexType', function() {
        it ('should allow serialization and deserialization of structured types', function() {
            var data = { foo: 'foo' };
            
            var obj = env.getType('foo_type').deserialize(data);
            
            expect(obj.foo).toBeDefined();
            expect(obj.foo()).toEqual(data.foo);
            
            data = env.getType('foo_type').serialize(obj);
            expect(data.foo).toEqual(obj.foo());
        });
        
        it ('should allow serialization and deserialization of nested types', function() {
            env.registerComplexType({
                type_name: 'bar_type',
                properties: {
                    bar: { type_name: 'foo_type' }
                }
            });
            
            var data = { bar: { foo: 'foo' } };
            
            var obj = env.getType('bar_type').deserialize(data);
            
            expect(obj.bar).toBeDefined();
            expect(obj.bar().foo).toBeDefined();
            expect(obj.bar().foo()).toEqual(data.bar.foo);
            
            data = env.getType('bar_type').serialize(obj);
            expect(data.bar.foo).toEqual(obj.bar().foo());
        });
        
        /*it ('should allow serialization and deserialization of lists', function() {
            env.registerComplexType({
                type_name: 'baz_type',
                properties: {
                    baz: { type_name: 'list', item_type: 'foo_type' }
                }
            });
            
            var data = { baz: [{ foo: 1 }, { foo: 2 }, { foo: 3 }] };
            
            var obj = env.getType('baz_type').deserialize(data);
            
            expect(obj.baz()[0].foo()).toEqual(data.baz[0].foo);
            expect(obj.baz()[1].foo()).toEqual(data.baz[1].foo);
            expect(obj.baz()[2].foo()).toEqual(data.baz[2].foo);
            
            data = env.getType('baz_type').serialize(obj);
            
            expect(data.baz[0].foo).toEqual(obj.baz()[0].foo());
            expect(data.baz[1].foo).toEqual(obj.baz()[1].foo());
            expect(data.baz[2].foo).toEqual(obj.baz()[2].foo());
        });*/
    });
    
    // TODO: test nested types
});