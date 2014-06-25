"use strict";

describe("Scope", function () {

    it("Should be possible to create and instance and use it as an object", function () {
        var scope = new Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });

    describe("digest", function () {

        var scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it ("Should call the listener function of a watch on first $digest", function () {
            var watchFunction = function () {
                return 'wat';
            };
            var listenerFunction = jasmine.createSpy();
            scope.$watch(watchFunction,  listenerFunction);
            scope.$digest();
            expect(listenerFunction).toHaveBeenCalled();
        });

        it ("Should call the watch function with the scope as an argument", function () {
            var watchFunction = jasmine.createSpy();
            var listenerFunction = function () {};
            scope.$watch(watchFunction, listenerFunction);
            scope.$digest();
            expect(watchFunction).toHaveBeenCalledWith(scope);
        });

        it ("Should call the listener function when the watched value changes", function () {
            console.log(scope);
            scope.someValue = 'a';
            scope.counter = 0;
            var watchFunction = function(scope) {
                return scope.someValue;
            };
            console.log(scope);
            var listenerFunction = function (newValue, oldValue, scope) {
                scope.counter = scope.counter + 1;
            };
            scope.$watch(watchFunction, listenerFunction);
            console.log(scope);
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.someValue = 'b';
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

    });
});