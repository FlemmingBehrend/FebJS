/* jshint globalstrict: true */
/* global angular: false */
"use strict";

describe('injector', function () {

    beforeEach(function () {
        delete window.angular;
        setupModuleLoader(window);
    });

    it ('Should be possible to create an injector', function () {
        var injector = createInjector([]);
        expect(injector).toBeDefined();
    });

    it ('Should have a constant that that have been registered to a module', function () {
        var module = angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(true);
    });

    it ('Should not have non-registered constant', function () {
        angular.module('myModule', []);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(false);
    });

    it ('does not allow a constant called hasOwnProperty', function () {
        var module = angular.module('myModule', []);
        module.constant('hasOwnProperty', _.constant(false));
        expect(function () {
            createInjector(['myModule']);
        }).toThrow();
    });

    it ('Should be able to return a registered constant', function () {
        var module = angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('aConstant')).toBe(42);
    });

    it ('loads multiple modules', function () {
        var module1 = angular.module('module1', []);
        var module2 = angular.module('module2', []);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['module1', 'module2']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });
    
    it ('loads required modules of a module', function () {
        var module1 = angular.module('module1', []);
        var module2 = angular.module('module2', ['module1']);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['module2']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    it ('loads a chain of required modules', function () {
        var module1 = angular.module('module1', []);
        var module2 = angular.module('module2', ['module1']);
        var module3 = angular.module('module3', ['module2']);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        module3.constant('thirdConstant', 44);
        var injector = createInjector(['module3']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
        expect(injector.has('thirdConstant')).toBe(true);
    });

    it ('loads each module once', function () {
        var module1 = angular.module('module1', ['module2']);
        var module2 = angular.module('module2', ['module1']);
        createInjector(['module1']);
    });

    it ('invokes an annotated function with dependency injection', function() {
        var module = angular.module('module1', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['module1']);
        var fn = function(one, two) { return one + two; };
        fn.$inject = ['a', 'b'];
        expect(injector.invoke(fn)).toBe(3);
    });

    it ('does not accepts non-strings as injection tokens', function () {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        var injector = createInjector(['myModule']);
        var fn = function (one, two) {
            return one + two;
        };
        fn.$inject = ['a', 2];
        expect(function () {
            injector.invoke(fn);
        }).toThrow();
    });

    it ('invokes a function with the given this context', function () {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        var injector = createInjector(['myModule']);
        var obj = {
            two: 2,
            fn: function (one) {
                return one + this.two;
            }
        };
        obj.fn.$inject = ['a'];
        expect(injector.invoke(obj.fn, obj)).toBe(3);
    });

    it ('overrides dependencies with locals when invoking', function () {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);
        var fn = function (one, two) {
            return one + two;
        };
        fn.$inject = ['a', 'b'];
        expect(injector.invoke(fn, undefined, {b: 3})).toBe(4);
    });

    describe('annotate', function () {

        it ('returns the $inject annotation of a function when it has one', function () {
            var injector = createInjector([]);
            var fn = function() {};
            fn.$inject = ['a', 'b'];
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        });

        it ('returns the array-style annotations of a function', function () {
            var injector = createInjector([]);
            var fn = ['a', 'b', function(){}];
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        });

        it ('returns an empty array for a non-annotated 0-arg function', function () {
            var injector = createInjector([]);
            var fn = function() {};
            expect(injector.annotate(fn)).toEqual([]);
        });

        it ('returns annotations parsed from function args when not annotated', function () {
            var injector = createInjector([]);
            var fn = function(a, b) { };
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        });

        it ('strips comments from argument list when parsing', function () {
            var injector = createInjector([]);
            var fn = function (a, /*b,*/ c){};
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        });

        it ('strips several comments from argument lists when parsing', function() {
            var injector = createInjector([]);
            var fn = function(a, /*b,*/ c/*, d*/) { };
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        });

        it ('strips // comments from argument lists when parsing', function() {
            var injector = createInjector([]);
            var fn = function(a,
            //b,
            c) { };
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        });

        it ('strips surrounding underscores from argument names when parsing', function() {
            var injector = createInjector([]);
            var fn = function(a, _b_, c_, _d, an_argument) { };
            expect(injector.annotate(fn)).toEqual(['a', 'b', 'c_', '_d', 'an_argument']);
        });

        it ('throws when using non-annotated fn in strict mode', function () {
            var injector = createInjector([], true);
            var fn = function(a, b, c) {};
            expect(function (){
                injector.annotate(fn);
            }).toThrow();
        });

        it ('invokes an array-annotated function with dependency injection', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            var fn = ['a', 'b', function(one, two) { return one + two; }];
            expect(injector.invoke(fn)).toBe(3);
        });

        it ('invokes a non-annotated function with dependency injection', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            var fn = function(a, b) { return a + b; };
            expect(injector.invoke(fn)).toBe(3);
        });

        it('instantiates an annotated constructor function', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            function Type(one, two) { this.result = one + two; }
            Type.$inject = ['a', 'b'];
            var instance = injector.instantiate(Type);
            expect(instance.result).toBe(3);
        });

        it('instantiates an array-annotated constructor function', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            function Type(one, two) { this.result = one + two; }
            var instance = injector.instantiate(['a', 'b', Type]);
            expect(instance.result).toBe(3);
        });

        it('instantiates a non-annotated constructor function', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            function Type(a, b) { this.result = a + b; }
            var instance = injector.instantiate(Type);
            expect(instance.result).toBe(3);
        });

        it('uses the prototype of the constructor when instantiating', function() {
            function BaseType() { }
            BaseType.prototype.getValue = _.constant(42);
            function Type() { this.v = this.getValue(); }
            Type.prototype = BaseType.prototype;
            angular.module('myModule', []);
            var injector = createInjector(['myModule']);
            var instance = injector.instantiate(Type);
            expect(instance.v).toBe(42);
        });

        it('supports locals when instantiating', function() {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);
            function Type(a, b) { this.result = a + b; }
            var instance = injector.instantiate(Type, {b: 3});
            expect(instance.result).toBe(4);
        });

        it('allows registering a provider and uses its $get', function () {
            var module = angular.module('myModule', []);
            module.provider('a', {
                $get: function () {
                    return 42;
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.has('a')).toBe(true);
            expect(injector.get('a')).toBe(42);
        });



    });

});