/* jshint globalstrict: true */
/* global setupModuleLoader: false */
"use strict";

describe('setupModuleloader', function () {

    beforeEach(function () {
        delete window.angular;
    });

    it ('Should expose angular on the window', function () {
        setupModuleLoader(window);
        expect(window.angular).toBeDefined();
    });

    it ('Should create the angular global only once', function () {
        setupModuleLoader(window);
        var ng = window.angular;
        setupModuleLoader(window);
        expect(ng).toBe(window.angular);
    });

    it ('Should expose the angular module function', function () {
        setupModuleLoader(window);
        expect(window.angular.module).toBeDefined();
    });

    it ('Should expose the angular module function only once', function () {
        setupModuleLoader(window);
        var module = window.angular.module;
        setupModuleLoader(window);
        expect(window.angular.module).toBe(module);
    });

    describe('modules', function () {

        beforeEach(function () {
            setupModuleLoader(window);
        });

        it ('Should be possible to register a module', function () {
            var myModule = window.angular.module('myModule', []);
            expect(myModule).toBeDefined();
            expect(myModule.name).toEqual('myModule');
        });

        it ('Should replace a module when registered with the same name', function () {
            var myModule = window.angular.module('myModule', []);
            var myNewModule = window.angular.module('myModule', []);
            expect(myNewModule).not.toBe(myModule);
        });

        it ('Should attach a requires array to the module', function () {
            var myModule = window.angular.module('myModule', ['myOtherModule']);
            expect(myModule.requires).toEqual(['myOtherModule']);
        });

    });
});