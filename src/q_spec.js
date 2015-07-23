/* jshint globalstrict: true */
/* global publishExternalAPI: false, createInjector: false */

'use strict';

describe('$q', function () {

    var $q, $rootScope;

    beforeEach(function () {
        publishExternalAPI();
        var injector = createInjector(['ng']);
        $q = injector.get('$q');
        $rootScope = injector.get('$rootScope');
    });

    it('can create a deferred', function () {
        var d = $q.defer();
        expect(d).toBeDefined();
    });

    it('can resolve a promise', function (done) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        var promiseSpy = jasmine.createSpy('promiseSpy');
        promise.then(promiseSpy);
        deferred.resolve('a-ok');
        setTimeout(function () {
            expect(promiseSpy).toHaveBeenCalledWith('a-ok');
            done();
        }, 0);
    });

    it('works when a promise is assigned after it has been resolved', function (done) {
        var deferred = $q.defer();
        deferred.resolve(42);
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        setTimeout(function () {
            expect(promiseSpy).toHaveBeenCalledWith(42);
            done();
        }, 0);
    });

    it('does not resolve promises immediately', function () {
        var deferred = $q.defer();
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        deferred.resolve(42);
        expect(promiseSpy).not.toHaveBeenCalled();
    });

    it('resolved a promise doing next $digest', function () {
        var deferred = $q.defer();
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        deferred.resolve(42);
        $rootScope.$apply();
        expect(promiseSpy).toHaveBeenCalledWith(42);
    });

    it('may only be resolved once', function () {
        var deferred = $q.defer();
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        deferred.resolve(42);
        deferred.resolve(43);
        $rootScope.$apply();
        expect(promiseSpy.calls.count()).toBe(1);
        expect(promiseSpy).toHaveBeenCalledWith(42);
    });

    it('may only be revolved once even if resolved in two different digests', function () {
        var deferred = $q.defer();
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        deferred.resolve(42);
        $rootScope.$apply();
        expect(promiseSpy).toHaveBeenCalledWith(42);
        deferred.resolve(43);
        $rootScope.$apply();
        expect(promiseSpy.calls.count()).toBe(1);
    });

    it('resolves a promise added after the deferred have been resolved', function () {
        var deferred = $q.defer();
        deferred.resolve(42);
        $rootScope.$apply();
        var promiseSpy = jasmine.createSpy('promiseSpy');
        deferred.promise.then(promiseSpy);
        $rootScope.$apply();
        expect(promiseSpy).toHaveBeenCalledWith(42);
    });

    it('may have multiple callbacks', function () {
        var deferred = $q.defer();
        var firstSpy = jasmine.createSpy('firstSpy');
        var secondSpy = jasmine.createSpy('secondSpy');
        deferred.promise.then(firstSpy);
        deferred.promise.then(secondSpy);
        deferred.resolve(42);
        $rootScope.$apply();
        expect(firstSpy).toHaveBeenCalledWith(42);
        expect(secondSpy).toHaveBeenCalledWith(42);
    });

    it('invokes callbacks once', function () {
        var deferred = $q.defer();
        var firstSpy = jasmine.createSpy('firstSpy');
        var secondSpy = jasmine.createSpy('secondSpy');
        deferred.promise.then(firstSpy);
        deferred.resolve(42);
        $rootScope.$apply();
        expect(firstSpy.calls.count()).toBe(1);
        expect(secondSpy.calls.count()).toBe(0);
        deferred.promise.then(secondSpy);
        expect(firstSpy.calls.count()).toBe(1);
        expect(secondSpy.calls.count()).toBe(0);
        $rootScope.$apply();
        expect(firstSpy.calls.count()).toBe(1);
        expect(secondSpy.calls.count()).toBe(1);
    });

});