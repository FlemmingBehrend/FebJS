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

});