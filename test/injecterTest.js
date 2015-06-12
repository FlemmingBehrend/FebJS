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

});