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

    it ('Should be able to return a registered constant', function () {
        var module = angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('aConstant')).toBe(42);
    });

    it ('Should be able to load multiple modules', function () {
        var module1 = angular.module('myModule1', []);
        var module2 = angular.module('myModule2', []);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['myModule1', 'myModule2']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    it ('Should load the required modules of another module', function () {
        var module1 = angular.module('myModule1', []);
        var module2 = angular.module('myModule2', ['myModule1']);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['myModule2']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    it ('Should load required modules recursively', function () {
        var module1 = angular.module('myModule1', []);
        var module2 = angular.module('myModule2', ['myModule1']);
        var module3 = angular.module('myModule3', ['myModule2']);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        module3.constant('yetAnotherConstant', 44);
        var injector = createInjector(['myModule3']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
        expect(injector.has('yetAnotherConstant')).toBe(true);
    });

    it ('Should load each module only once', function () {
        angular.module('myModule1', ['myModule2']);
        angular.module('myModule2', ['myModule1']);
        createInjector(['myModule1', 'myModule2']);
    });
});