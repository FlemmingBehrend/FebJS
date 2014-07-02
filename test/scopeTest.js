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

        it ("Should call the listener function of a $watch on first $digest", function () {
            var watchFunction = function () {
                return 'wat';
            };
            var listenerFunction = jasmine.createSpy();
            scope.$watch(watchFunction,  listenerFunction);
            scope.$digest();
            expect(listenerFunction).toHaveBeenCalled();
        });

        it ("Should call the $watch function with the scope as an argument", function () {
            var watchFunction = jasmine.createSpy();
            var listenerFunction = function () {};
            scope.$watch(watchFunction, listenerFunction);
            scope.$digest();
            expect(watchFunction).toHaveBeenCalledWith(scope);
        });

        it ("Should call the listener function when the watched value changes", function () {
            scope.someValue = 'a';
            scope.counter = 0;
            var watchFunction = function(scope) {
                return scope.someValue;
            };
            var listenerFunction = function (newValue, oldValue, scope) {
                scope.counter = scope.counter + 1;
            };
            scope.$watch(watchFunction, listenerFunction);
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

        it ("Should call the listener when value is first undefined", function() {
            scope.counter = 0;
            var watchFunction = function (scope) {
                return scope.someValue;
            };
            var listenerFunction = function (newValue, oldValue, scope) {
                scope.counter++;
            };
            scope.$watch(watchFunction, listenerFunction);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should call listener with new value as the old value the first time", function () {
            scope.someValue = 123;
            var oldValueGiven = undefined;
            var watchFunction = function (scope) {
                return scope.someValue;
            };
            var listenerFunction = function (newValue, oldValue) {
                oldValueGiven = oldValue;
            };
            scope.$watch(watchFunction, listenerFunction);
            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it ("Should be possible to have watchers without a listener", function () {
            var watchFn = jasmine.createSpy();
            scope.$watch(watchFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalled();
        });

        it ("Should trigger chained watchers in the same $digest", function () {
            scope.name = "Flemming";
            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0,1) + ".";
                    }
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.name;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );
            scope.$digest();
            expect(scope.initial).toBe("F.");
        });

        it ("Should give up on the watches after 10 iterations", function () {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.$watch(
                function (scope) {
                    return scope.counterA;
                },
                function (newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.counterB;
                },
                function (newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );
            expect((function() { scope.$digest(); })).toThrow();
        });

        it ("Should end the $digest when the last $watch is clean", function () {
            scope.array = _.range(100);
            var watchExecutions = 0;
            _.times(100, function (i) {
                scope.$watch(
                    function (scope) {
                        watchExecutions++;
                        var val = scope.array[i];
                        return scope.array[val];
                    },
                    function (newValue, oldValue, scope) {
                    }
                );
            });
            scope.$digest();
            expect(watchExecutions).toBe(200);

            scope.array[0] = 111;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it ("Should not end $digest so that new $watch are not run", function () {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$watch(
                        function (scope) {
                            return scope.aValue;
                        },
                        function (newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should compare based on value if enabled", function () {
            scope.aValue = [1,2,3];
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should correctly handle NaNs", function() {
            scope.number = 0/0; // NaN
            scope.counter = 0;
            scope.$watch(
                function(scope) {
                    return scope.number;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should execute $eval'ed function and return result", function () {
            scope.aValue = 42;
            var result = scope.$eval(
                function (scope) {
                    return scope.aValue;
                }
            );
            expect(result).toBe(42);
        });

        it ("Should pass the second $eval argument straight through", function () {
            scope.aValue = 40;
            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);
            expect(result).toBe(42);
        });

        it ("Should execute $apply'ed function and start a $digest", function () {
            scope.aValue = 'someValue';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$apply(
                function (scope) {
                    scope.aValue = 'someOtherValue';
                }
            );
            expect(scope.counter).toBe(2);
        });

        it ("Should execute $evalAsync'ed function later in the same $digest cycle", function () {
            scope.aValue = [1,2,3];
            scope.asyncExecuted = false;
            scope.asyncExecutedImmediately = false;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$evalAsync(function (scope) {
                        scope.asyncExecuted = true;
                    });
                    scope.asyncExecutedImmediately = scope.asyncExecuted;
                }
            );
            scope.$digest();
            expect(scope.asyncExecuted).toBe(true);
            expect(scope.asyncExecutedImmediately).toBe(false);
        });

        it ("Should execute $evalAsync'ed functions added by watch functions", function() {
            scope.aValue = [1,2,3];
            scope.asyncExecuted = false;
            scope.$watch(
                function (scope) {
                    if (!scope.asyncExecuted) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncExecuted = true;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$digest();
            expect(scope.asyncExecuted).toBe(true);
        });

        it ("Should execute $evalAsync'ed functions even when $digest is not dirty", function() {
            scope.aValue = [1,2,3];
            scope.asyncExecutedNumberOfTimes = 0;
            scope.$watch(
                function (scope) {
                    if (scope.asyncExecutedNumberOfTimes < 2) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncExecutedNumberOfTimes++;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$digest();
            expect(scope.asyncExecutedNumberOfTimes).toBe(2);
        });

        it ("Should eventually halt $evalAsyncs added by $watch", function() {
            scope.aValue = [1,2,3];
            scope.$watch(
                function (scope) {
                    scope.$evalAsync(function (scope) {
                    });
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            expect(function () { scope.$digest(); }).toThrow();
        });

        it ("Should have a $$phase variable that contain the name of the current digest phase", function () {
            scope.aValue = [1,2,3];
            scope.phaseInWatchFunction = null;
            scope.phaseInListenerFunction = null;
            scope.phaseInApplyFunction = null;
            scope.$watch(
                function (scope) {
                    scope.phaseInWatchFunction = scope.$$phase;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.phaseInListenerFunction = scope.$$phase;
                }
            );
            scope.$apply(
                function (scope) {
                    scope.phaseInApplyFunction = scope.$$phase;
                }
            );
            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListenerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');
        });

        it ("Should schedule a $digest in $evalAsync", function (done) {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$evalAsync(
                function (scope) {
                }
            );
            expect(scope.counter).toBe(0);
            setTimeout(
                function() {
                    expect(scope.counter).toBe(1);
                    done();
                }, 50
            );
        });

        it ("Should run a $$postDigest after each $digest", function () {
            scope.counter = 0;
            scope.$$postDigest(
                function () {
                    scope.counter++;
                }
            );
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should not include evocation of $$postDigest in $digest", function () {
            scope.aValue = "original value";
            scope.$$postDigest(
                function () {
                    scope.aValue = "value changed";
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.watchedValue = newValue;
                }
            );
            scope.$digest();
            expect(scope.watchedValue).toBe('original value');
            scope.$digest();
            expect(scope.watchedValue).toBe('value changed');
        });

        it ("Should catch exceptions in watch functions and continue", function () {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    throw "error";
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should catch exceptions in listerner functions and continue", function () {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    throw "error";
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should catch exceptions in $evalAsync", function (done) {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$evalAsync(
                function (scope) {
                    throw "error";
                }
            );
            setTimeout(
                function () {
                    expect(scope.counter).toBe(1);
                    done();
                }, 50
            );

        });
        
        it ("Should be possible to execute a second $$postDigest, even if an exception is thrown in the first", function () {
            var didRun = false;
            scope.$$postDigest(
                function() {
                    throw "error";
                }
            );
            scope.$$postDigest(
                function() {
                    didRun = true;
                }
            );
            scope.$digest();
            expect(didRun).toBe(true);
        });

        it ("Should be possible to destroy a $watch with a removal function", function () {
            scope.aValue = "abc";
            scope.counter = 0;
            var destroyWatch = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue = "another value";
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.aValue = "yet another value";
            destroyWatch();
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should be possible to destroy a $watch doing a $digest", function () {
            scope.aValue = "abc";
            var watchCalls = [];
            scope.$watch(
                function (scope) {
                    watchCalls.push("first");
                    return scope.aValue;
                }
            );
            var destroyWatch = scope.$watch(
                function (scope) {
                    watchCalls.push("second");
                    destroyWatch();
                }
            );
            scope.$watch(
                function(scope) {
                    watchCalls.push('third');
                    return scope.aValue;
                }
            );
            scope.$digest();
            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
        });

        it ("Should be possible to destroy a $watch from another $watch during $digest", function() {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    destroyWatch();
                }
            );
            var destroyWatch = scope.$watch(
                function (scope) {
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should be possible to destroy several $watches during $digest", function() {
            scope.aValue = "abc";
            scope.counter = 0;
            var destroyWatch1 = scope.$watch(
                function(scope) {
                    destroyWatch1();
                    destroyWatch2();
                }
            );
            var destroyWatch2 = scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(0);
        });
    });
});