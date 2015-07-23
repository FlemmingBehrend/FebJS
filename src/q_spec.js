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

    it('can reject a deferred', function () {
        var deferred = $q.defer();
        var fulfillSpy = jasmine.createSpy('fulfillSpy');
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.then(fulfillSpy, rejectSpy);
        deferred.reject('fail');
        $rootScope.$apply();
        expect(fulfillSpy).not.toHaveBeenCalled();
        expect(rejectSpy).toHaveBeenCalledWith('fail');
    });

    it('can reject a promise just once', function () {
        var deferred = $q.defer();
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.then(null, rejectSpy);
        deferred.reject('fail');
        $rootScope.$apply();
        expect(rejectSpy.calls.count()).toBe(1);
        deferred.reject('fail again');
        $rootScope.$apply();
        expect(rejectSpy.calls.count()).toBe(1);
    });

    it('can not fulfill a promise once rejected', function () {
        var deferred = $q.defer();
        var fulfillSpy = jasmine.createSpy('fulfillSpy');
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.then(fulfillSpy, rejectSpy);
        deferred.reject('fail');
        $rootScope.$apply();
        deferred.resolve('success');
        $rootScope.$apply();
        expect(fulfillSpy).not.toHaveBeenCalled();
    });

    it('does not require a failure handler each time', function () {
        var deferred = $q.defer();
        var fulfillSpy = jasmine.createSpy('fulfillSpy');
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.then(fulfillSpy);
        deferred.promise.then(null, rejectSpy);
        deferred.reject('fail');
        $rootScope.$apply();
        expect(rejectSpy).toHaveBeenCalledWith('fail');
    });

    it('does not require a success handler each time', function () {
        var deferred = $q.defer();
        var fulfillSpy = jasmine.createSpy('fulfillSpy');
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.then(fulfillSpy);
        deferred.promise.then(null, rejectSpy);
        deferred.resolve('ok');
        $rootScope.$apply();
        expect(fulfillSpy).toHaveBeenCalledWith('ok');
    });

    it('can register rejection handler with catch', function () {
        var deferred = $q.defer();
        var rejectSpy = jasmine.createSpy('rejectSpy');
        deferred.promise.catch(rejectSpy);
        deferred.reject('fail');
        $rootScope.$apply();
        expect(rejectSpy).toHaveBeenCalled();
    });

});