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
});