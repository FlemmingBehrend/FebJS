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

    describe('module.constant', function () {

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

    });

    describe('module loading', function () {

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

    });

    describe('invoke', function () {

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

    });

    describe('instantiate', function () {

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


    });

    describe('provider', function () {

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

        it('injects the $get method of a provider', function () {
            var module = angular.module('myModule', []);
            module.constant('a', 1);
            module.provider('b', {
                $get: function(a) {
                    return a + 2;
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('b')).toBe(3);
        });

        it('injects the $get method of a provider lazily', function () {
            var module = angular.module('myModule', []);
            module.provider('b', {
                $get: function (a) {
                    return a + 2;
                }
            });
            module.provider('a', {
                $get: _.constant(1)
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('b')).toBe(3);
        });

        it('instantiates a dependency only once', function () {
            var module = angular.module('myModule', []);
            module.provider('a', {
                $get: function () {
                    return {};
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(injector.get('a'));
        });

        it('notifies user of circular dependencies', function () {
            var module = angular.module('myModule', []);
            module.provider('a', {$get: function(b) {}});
            module.provider('b', {$get: function(c) {}});
            module.provider('c', {$get: function(a) {}});
            var injector = createInjector(['myModule']);
            expect(function() {
                injector.get('a');
            }).toThrowError('Circular dependency found: a <- c <- b <- a');
        });

        it('cleans up the circular dependency marker when instantiation fails', function () {
            var module = angular.module('myModule', []);
            module.provider('a', {
                $get: function () {
                    throw 'Failing Instantiation';
                }
            });
            var injector = createInjector(['myModule']);
            expect(function() {
                injector.get('a');
            }).toThrow('Failing Instantiation');
            expect(function() {
                injector.get('a');
            }).toThrow('Failing Instantiation');
        });

        it('instantiates a provider is given as a constructor function', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                this.$get = function () {
                    return 42;
                };
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('injects the given provider constructor function', function () {
            var module = angular.module('myModule', []);
            module.constant('b', 2);
            module.provider('a', function AProvider(b) {
                this.$get = function () {
                    return 1 + b;
                };
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(3);
        });

        it('injects another provider to a provider constructor function', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                var value = 1;
                this.setValue = function (v) {
                    value = v;
                };
                this.$get = function () {
                    return value;
                };
            });
            module.provider('b', function BProvider(aProvider) {
                aProvider.setValue(2);
                this.$get = function () {};
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(2);
        });

        it('should not be possible to inject an instance to a provider constructor function', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider () {
                this.$get = function () {
                    return 1;
                };
            });
            module.provider('a', function (a) {
                this.$get = function () {
                    return a;
                };
            });
            expect(function () {
                createInjector(['myModule']);
            }).toThrow();
        });

        it('is not possible to inject providers to a $get function', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                this.$get = function () {
                    return 1;
                };
            });
            module.provider('b', function BProvider() {
                this.$get = function (aProvider) {
                    return aProvider.$get();
                };
            });
            var injector = createInjector(['myModule']);
            expect(function () {
                injector.get('b');
            }).toThrow();
        });

        it('is not possible to inject providers when using inject.invoke', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                this.$get = function () {
                    return 1;
                };
            });
            var injector = createInjector(['myModule']);
            expect(function () {
                injector.invoke(function (aProvider) {});
            }).toThrow();
        });

        it('registers constants first to make them available to providers', function() {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider(b) {
                this.$get = function() {
                    return b;
                };
            });
            module.constant('b', 42);
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

    });

    describe('$injector', function () {

        it('allows injecting the $injector to $get', function () {
            var module = angular.module('myModule', []);
            module.constant('a', 42);
            module.provider('b', function BProvider() {
                this.$get = function ($injector) {
                    return $injector.get('a');
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('b')).toBe(42);
        });

        it('allows injecting the $injector to providers', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                this.value = 42;
                this.$get = function () {
                    return this.value;
                }
            });
            module.provider('b', function BProvider($injector) {
                var aProvider = $injector.get('aProvider');
                this.$get = function () {
                    return aProvider.value;
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('b')).toBe(42);
        });

    });

    describe('$provide', function () {

        it('allows injecting the $provide service to providers', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider($provide) {
                $provide.constant('b', 2);
                this.$get = function (b) {
                    return b + 1;
                }
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(3);
        });

        it('does not allow injecting the $provide service to $get', function () {
            var module = angular.module('myModule', []);
            module.provider('a', function AProvider() {
                this.$get = function ($provide) {};
            });
            var injector = createInjector(['myModule']);
            expect(function () {
                injector.get('a');
            }).toThrow();
        });

    });

    describe('module.config', function () {

        it('runs config blocks when the injector is created', function () {
            var module = angular.module('myModule', []);
            var hasRun = false;
            module.config(function () {
                hasRun = true;
            });
            createInjector(['myModule']);
            expect(hasRun).toBe(true);
        });

        it('allows injection of $provide to config blocks', function () {
            var module = angular.module('myModule', []);
            module.config(function ($provide) {
                $provide.constant('a', 42);
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('allows registering config blocks before providers', function () {
            var module = angular.module('myModule', []);
            module.config(function (aProvider) {});
            module.provider('a', function AProvider() {
                this.$get = function () {
                    return 42;
                };
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('runs a config block added doing module registration', function () {
            angular.module('myModule', [], function ($provide) {
                $provide.constant('a', 42);
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

    });

    describe('module.run', function () {

        it('runs run blocks when the injector is created', function() {
            var module = angular.module('myModule', []);
            var hasRun = false; module.run(
                function() {
                    hasRun = true;
                });
            createInjector(['myModule']);
            expect(hasRun).toBe(true);
        });

        it('injects run blocks with the instance injector', function () {
            var module = angular.module('myModule', []);
            module.provider('a', {$get: _.constant(42)});
            var gotA = null;
            module.run(function (a) {
                gotA = a;
            });
            createInjector(['myModule']);
            expect(gotA).toBe(42);
        });

        it('configures all modules before running any run blocks', function () {
            var module1 = angular.module('module1', []);
            module1.provider('a', {$get: _.constant(1)});
            var result = null;
            module1.run(function (a, b) {
                result = a + b;
            });
            var module2 = angular.module('module2', []);
            module2.provider('b', {$get: _.constant(2)});
            createInjector(['module1', 'module2']);
            expect(result).toBe(3);
        });

    });

    describe('function module', function () {

        it('runs a function module dependency as a config block', function () {
            var functionModule = function ($provide) {
                $provide.constant('a', 42);
            };
            angular.module('myModule', [functionModule]);
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('runs a function module with array injection as config block', function () {
            var functionModule = ['$provide', function ($provide) {
                $provide.constant('a', 42);
            }];
            angular.module('myModule', [functionModule]);
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('supports returning a run block from a function module', function () {
            var result = null;
            var functionModule = function ($provide) {
                $provide.constant('a', 42);
                return function (a) {
                    result = a;
                };
            };
            angular.module('myModule', [functionModule]);
            createInjector(['myModule'])
            expect(result).toBe(42);
        });

        it('only loads function modules once', function () {
            var loadedTimes = 0;
            var functionModule = function () {
                loadedTimes++;
            };
            angular.module('myModule', [functionModule, functionModule]);
            createInjector(['myModule']);
            expect(loadedTimes).toBe(1);
        });

    });

    describe('module.factory', function () {

        it('allows registering a factory', function () {
            var module = angular.module('myModule', []);
            module.factory('a', function () {
                return 42;
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('injects a factory function with instances', function () {
            var module = angular.module('myModule', []);
            module.factory('a', function () {
                return 1;
            });
            module.factory('b', function (a) {
                return a + 2;
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('b')).toBe(3);
        });

        it('only calls a factory function once', function () {
            var module = angular.module('myModule', []);
            module.factory('a', function () {
                return {};
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(injector.get('a'));
        });

        it('forces a factory to return a value', function () {
            var module = angular.module('myModule', []);
            module.factory('a', function () {});
            module.factory('b', function () {
                return null;
            });
            var injector = createInjector(['myModule']);
            expect(function () {
                injector.get('a');
            }).toThrow();
            expect(injector.get('b')).toBeNull();
        });

    });

    describe('module.value', function () {

        it('allows registering a value', function () {
            var module = angular.module('myModule', []);
            module.value('a', 42);
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBe(42);
        });

        it('does not make values available to config blocks', function () {
            var module = angular.module('myModule', []);
            module.value('a', 42);
            module.config(function (a) {});
            expect(function () {
                createInjector(['myModule']);
            }).toThrow();
        });

        it('allows an undefined value', function () {
            var module = angular.module('myModule', []);
            module.value('a', undefined);
            var injector = createInjector(['myModule']);
            expect(injector.get('a')).toBeUndefined();
        });

    });

    describe('module.service', function () {

        it('allows registering a service', function () {
            var module = angular.module('myModule', []);
            module.service('aService', function MyService() {
                this.getValue = function () {
                    return 42;
                };
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('aService').getValue()).toBe(42);
        });

        it('injects service constructor with instances', function () {
            var module = angular.module('myModule', []);
            module.value('theValue', 42);
            module.service('aService', function MyService(theValue) {
                this.getValue = function () {
                    return theValue;
                };
            });
            var injector = createInjector(['myModule']);
            expect(injector.get('aService').getValue()).toBe(42);
        });

        it('only instantiates services once', function () {
            var module = angular.module('myModule', []);
            module.service('aService', function MyService() {});
            var injector = createInjector(['myModule']);
            expect(injector.get('aService')).toBe(injector.get('aService'));
        });

    });
});