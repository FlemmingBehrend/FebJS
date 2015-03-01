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
});