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

        it ("Should accept expressions for $watch functions", function () {
            var theValue;
            scope.$watch('42', function (newValue, oldValue, scope) {
                theValue = newValue;
            });
            scope.$digest();
            expect(theValue).toBe(42);
        });

        it ("Should remove constant watches after first invocation", function () {
            scope.$watch('42', function () {
            });
            scope.$digest();
            expect(scope.$$watchers.length).toBe(0);
        });

        it ("Should accept expressions for listener functions", function () {
            scope.$watch("42", "'fourty-two'");
            scope.$digest();
        });

        it ("Should accept expressions in $eval", function () {
            expect(scope.$eval("42")).toBe(42);
        });

        it('Should accept expressions in $apply', function() {
            expect(scope.$apply("42")).toBe(42);
        });
        it('Should accept expressions in $evalAsync', function(done) {
            scope.$evalAsync("42");
            scope.$$postDigest(done);
        });
    });

    describe("inheritance", function() {

        it ("Should inherit the parents properties", function () {
            var parent = new Scope();
            parent.aValue = [1,2,3];
            var child = parent.$new();
            expect(child.aValue).toEqual([1,2,3]);
        });

        it ("Should not cause a parent to inherit it's child's properties", function () {
            var parent = new Scope();
            var child = parent.$new();
            child.aValue = [1, 2, 3];
            expect(parent.aValue).toBeUndefined();
        });

        it ("Should inherit the parent's properties even when defined after the link have been created", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it ("Should be possible to manipulate the parent's scope properties from a child scope", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it ("Should be possible to $watch a parent scope property from a child scope", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1,2,3];
            child.counter = 0;
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            child.$digest();
            expect(child.counter).toBe(1);
            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });

        it ("Should be possible to create nested scopes in any depth", function () {
            var a = new Scope();
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();
            a.value = 1;
            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);
            ab.anotherValue = 2;
            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });

        it ("Should be possible for a child scope to shadow properties from it's parent scope", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.name = "Flemming";
            child.name = "Frederik";
            expect(child.name).toBe("Frederik");
            expect(parent.name).toBe("Flemming");
        });

        it ("Should not be possible for a child scope to shadow attributes from it's parent scope", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.user = {name: "Flemming"};
            child.user.name = "Frederik";
            expect(child.user.name).toBe("Frederik");
            expect(parent.user.name).toBe("Frederik");
        });

        it ("Should not call $watch on parent scopes under $digest", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = "abc";
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it ("Should be possible for a scope to keep track of it's children scopes", function () {
            var parent = new Scope();
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();
            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);
            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);
        });

        it ("Should $digest it's own scope and it's children", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = "abc";
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    child.aValueWas = newValue;
                }
            );
            parent.$digest();
            expect(child.aValueWas).toBe("abc");
        });

        it ("Should $digest from the root on $apply", function () {
            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();
            parent.aValue = "abc";
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            child2.$apply(function (scope) {
            });
            expect(parent.counter).toBe(1);
        });

        it ("Should schedule a $digest from the root on $evalAsync", function (done) {
            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();
            parent.aValue = "abc";
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            child2.$evalAsync(function (scope) {
            })
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it ("Should not be possible to get access to parent attributes when the child scope is isolated", function () {
            var parent = new Scope();
            var child = parent.$new(true);
            parent.aValue = "abc";
            expect(child.aValue).toBeUndefined();
        });

        it ("Should not be possible to $watch parent attributes when the child scope is isolated", function () {
            var parent = new Scope();
            var child = parent.$new(true);
            parent.aValue = "abc";
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it ("Should $digest children of an isolated scope", function() {
            var parent = new Scope();
            var child = parent.$new(true);
            child.aValue = "abc";
            child.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            parent.$digest();
            expect(child.aValueWas).toBe("abc");
        });

        it ("Should visit child scopes on $digest even when the child scope is isolated", function () {
            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();
            parent.aValue = "abc";
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            child2.$apply(function () {
            });
            expect(parent.counter).toBe(1);
        });

        it ("Should schedule a $digest from the root when calling $evalAsync on an isolated scope", function (done) {
            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();
            parent.aValue = "abc";
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            child2.$evalAsync(function () {
            })
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it ("Should execute $evalAsync functions on isolated scopes", function (done) {
            var parent = new Scope();
            var child = parent.$new(true);
            child.$evalAsync(function (scope) {
                scope.didEvalAsync = true;
            });
            setTimeout(function () {
                expect(child.didEvalAsync).toBe(true);
                done();
            }, 50);
        });

        it ("Should execute $$postDigest functions on isolated scopes", function () {
            var parent = new Scope();
            var child = parent.$new(true);
            child.$$postDigest(function () {
                child.didPostDigest = true;
            });
            parent.$digest();
            expect(child.didPostDigest).toBe(true);
        });

        it ("Should possible to $destroy a child scope, so it is no longer in the $digest cycle", function () {
            var parent = new Scope();
            var child = parent.$new();

            child.aValue = [1,2,3];
            child.counter = 0;
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            parent.$digest();
            expect(child.counter).toBe(1);
            child.aValue.push(4);
            parent.$digest();
            expect(child.counter).toBe(2);
            child.$destroy();
            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);
        });

    });

    describe("watchCollection", function () {

        var scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it ("Should work like a normal $watch for non collections", function () {
            var valueProvided;
            scope.aValue = 42;
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    valueProvided = newValue;
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            expect(valueProvided).toBe(scope.aValue);
            scope.aValue = 43;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should work like a normal $watch for NaNs", function () {
            scope.aValue = 0/0;
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
            }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it ("Should notice when a value becomes an array", function () {
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr = [1,2,3];
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an item is added to an array", function () {
            scope.counter = 0;
            scope.arr = [1,2,3];
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an item is removed from an array", function () {
            scope.counter = 0;
            scope.arr = [1,2,3];
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.pop();
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an item is replaced in an array", function () {
            scope.counter = 0;
            scope.arr = [1,2,3];
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when items inside an array are reordered", function () {
            scope.counter = 0;
            scope.arr = [2,1,3];
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.sort();
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice an item replaced in an argument object", function () {
            (function() {
                scope.arrayLike = arguments;
            })(1,2,3);
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arrayLike;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arrayLike[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice an item replaced in an NoteList object", function () {
            document.documentElement.appendChild(document.createElement('div'));
            scope.arrayLike = document.getElementsByTagName('div');
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arrayLike;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            document.documentElement.appendChild(document.createElement('div'));
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when a value becomes an object", function () {
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj = {a: 1};
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an attribute is added to an object", function () {
            scope.counter = 0;
            scope.obj = {a:0};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.b = 1;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an attribute is changing in an object", function () {
            scope.counter = 0;
            scope.obj = {a:0};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.a = 1;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should notice when an attribute is removed from an object", function () {
            scope.counter = 0;
            scope.obj = {a:0};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            delete scope.obj.a;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should not consider an object with an attribute named 'length' to be an array", function () {
            scope.counter = 0;
            scope.obj = {length:42, otherKey:'abc'};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.newKey = 'def';
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it ("Should give the old non-collection value to listeners", function () {
            scope.aValue = 42;
            var oldGivenValue;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    oldGivenValue = oldValue;
                }
            );
            scope.$digest();
            scope.aValue = 43;
            scope.$digest();
            expect(oldGivenValue).toBe(42);
        });

        it ("Should give the old array value to listerners", function () {
            scope.aValue = [1, 2, 3];
            var oldValueGiven;
            scope.$watchCollection(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            scope.aValue.push(4);
            scope.$digest();
            expect(oldValueGiven).toEqual([1, 2, 3]);
        })

        it ("Should give the old object to the listerners", function () {
            scope.aValue = {a:1, b:2};
            var oldValueGiven;
            scope.$watchCollection(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            scope.aValue.c = 3;
            scope.$digest();
            expect(oldValueGiven).toEqual({a:1, b:2});
        });
        
        it ("Should use the newValue as the oldValue on first $digest", function () {
            scope.aValue = {a:1, b:2};
            var oldGivenValue;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    oldGivenValue = oldValue;
                }
            );
            scope.$digest();
            expect(oldGivenValue).toEqual({a:1, b:2});
        });

        it ("Should accept expressions for watch functions", function () {
            var theValue;
            scope.$watchCollection("[1,2,3]", function (newValue, oldValue, scope) {
                theValue = newValue;
            });
            scope.$digest();
            expect(theValue).toEqual([1,2,3]);
        });

        it ("Should accept expressions for listener functions", function () {
            var theValue;
            scope.$watchCollection("[1,2,3]", "'one-two-three'");
            scope.$digest();
        });
    });

    describe("events", function () {

        var parent;
        var scope;
        var child;
        var isolatedScope;

        beforeEach(function () {
            parent = new Scope();
            scope = parent.$new();
            child = scope.$new();
            isolatedScope = scope.$new(true);
        });

        it ("Should be possible to register event listeners", function () {
            var listenerFn1 = function () {};
            var listenerFn2 = function () {};
            var listenerFn3 = function () {};
            scope.$on("someEvent", listenerFn1);
            scope.$on("someEvent", listenerFn2);
            scope.$on("someOtherEvent", listenerFn3);
            expect(scope.$$listeners).toEqual({
                someEvent: [listenerFn1, listenerFn2],
                someOtherEvent: [listenerFn3]
            });
        });

        it ("Should have separate $$listeners for each $scope", function () {
            var listenerFn1 = function () {};
            var listenerFn2 = function () {};
            var listenerFn3 = function () {};
            scope.$on("someEvent", listenerFn1);
            child.$on("someEvent", listenerFn2);
            isolatedScope.$on("someEvent", listenerFn3);
            expect(scope.$$listeners).toEqual({someEvent: [listenerFn1]});
            expect(child.$$listeners).toEqual({someEvent: [listenerFn2]});
            expect(isolatedScope.$$listeners).toEqual({someEvent: [listenerFn3]});
        });

        _.forEach(['$emit', '$broadcast'], function (method) {

            it ("Should call listeners of matching event name on " + method, function () {
                var listenerFn1 = jasmine.createSpy();
                var listenerFn2 = jasmine.createSpy();
                scope.$on("someEvent", listenerFn1);
                scope.$on("someOtherEvent", listenerFn2);
                scope.$emit("someEvent");
                expect(listenerFn1).toHaveBeenCalled();
                expect(listenerFn2).not.toHaveBeenCalled();
            });

            it ("Should pass an event object with an attribute 'name' to listeners on " + method, function () {
                var listenerFn = jasmine.createSpy();
                scope.$on("someEvent", listenerFn);
                scope[method]("someEvent");
                expect(listenerFn).toHaveBeenCalled();
                expect(listenerFn.calls.mostRecent().args[0].name).toEqual("someEvent");
            });

            it ("Should pass the same event object to each listener on " + method, function () {
                var listenerFn1 = jasmine.createSpy();
                var listenerFn2 = jasmine.createSpy();
                scope.$on("someEvent", listenerFn1);
                scope.$on("someEvent", listenerFn2);
                scope[method]("someEvent");
                var event1 = listenerFn1.calls.mostRecent().args[0];
                var event2 = listenerFn2.calls.mostRecent().args[0];
                expect(event1).toBe(event2);
            });

            it ("Should be possible to pass additional arguments to listeners on " + method, function () {
                var listenerFn = jasmine.createSpy();
                scope.$on("someEvent", listenerFn);
                scope[method]("someEvent", "and", ["additional", "arguments"], "...");
                expect(listenerFn.calls.mostRecent().args[1]).toEqual("and");
                expect(listenerFn.calls.mostRecent().args[2]).toEqual(["additional", "arguments"]);
                expect(listenerFn.calls.mostRecent().args[3]).toEqual("...");
            });

            it ("Should return the event object on " + method, function () {
                var returnedEvent = scope[method]("someEvent");
                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual("someEvent");
            });

            it ("Should be possible to deregister an listener on " + method, function () {
                var listenerFn = jasmine.createSpy();
                var deregister = scope.$on("someEvent", listenerFn);
                deregister();
                scope[method]("someEvent");
                expect(listenerFn).not.toHaveBeenCalled();
            });

            it ("Should not skip the next listener when removed on " + method, function () {
                var deregister;
                var listenerFn = function () {
                    deregister();
                };
                var nextListener = jasmine.createSpy();
                deregister = scope.$on("someEvent", listenerFn);
                scope.$on("someEvent", nextListener);
                scope[method]("someEvent");
                expect(nextListener).toHaveBeenCalled();
            });

            it ("Should set defaultPrevented flag to true when preventDefault() is called on " + method, function () {
                var listenerFn = function (event) {
                    event.preventDefault();
                };
                scope.$on("someEvent", listenerFn);
                var event = scope[method]("someEvent");
                expect(event.defaultPrevented).toBe(true);
            });

            it ("Should not stop on exceptions on " + method, function () {
                var listenerFn1 = function (event) {
                    throw "listenerFn1 is throwing an exception";
                };
                var listenerFn2 = jasmine.createSpy();
                scope.$on("someEvent", listenerFn1);
                scope.$on("someEvent", listenerFn2);
                scope[method]("someEvent");
                expect(listenerFn2).toHaveBeenCalled();
            });
        });

        it ("Should propagate up the $scope hierarchy on $emit", function () {
            var parentListenerFn = jasmine.createSpy();
            var scopeListenerFn = jasmine.createSpy();
            var childListenerFn = jasmine.createSpy();
            parent.$on("someEvent", parentListenerFn);
            scope.$on("someEvent", scopeListenerFn);
            child.$on("someEvent", childListenerFn);
            scope.$emit("someEvent");
            expect(scopeListenerFn).toHaveBeenCalled();
            expect(parentListenerFn).toHaveBeenCalled();
            expect(childListenerFn).not.toHaveBeenCalled();
        });

        it ("Should propagate the same event object up on $emit", function () {
            var parentListenerFn = jasmine.createSpy();
            var scopeListenerFn = jasmine.createSpy();
            parent.$on("someEvent", parentListenerFn);
            scope.$on("someEvent", scopeListenerFn);
            scope.$emit("someEvent");
            var scopeEvent = scopeListenerFn.calls.mostRecent().args[0];
            var parentEvent = parentListenerFn.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(parentEvent);
        });

        it ("Should propagate down the $scope hierarchy on $broadcast", function () {
            var parentListenerFn = jasmine.createSpy();
            var scopeListenerFn = jasmine.createSpy();
            var childListenerFn = jasmine.createSpy();
            var isolatedChildListenerFn = jasmine.createSpy();
            parent.$on("someEvent", parentListenerFn);
            scope.$on("someEvent", scopeListenerFn);
            child.$on("someEvent", childListenerFn);
            isolatedScope.$on("someEvent", isolatedChildListenerFn);
            scope.$broadcast("someEvent");
            expect(parentListenerFn).not.toHaveBeenCalled();
            expect(scopeListenerFn).toHaveBeenCalled();
            expect(childListenerFn).toHaveBeenCalled();
            expect(isolatedChildListenerFn).toHaveBeenCalled();
        });

        it ("Should propagate the same event object down on $broadcast", function () {
            var scopeListenerFn = jasmine.createSpy();
            var childListenerFn = jasmine.createSpy();
            scope.$on("someEvent", scopeListenerFn);
            child.$on("someEvent", childListenerFn);
            scope.$broadcast("someEvent");
            var scopeEvent = scopeListenerFn.calls.mostRecent().args[0];
            var childEvent = childListenerFn.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(childEvent);
        });

        it ("Should attach targetScope on $emit", function () {
            var scopeListenerFn = jasmine.createSpy();
            var parentListenerFn = jasmine.createSpy();
            scope.$on("someEvent", scopeListenerFn);
            parent.$on("someEvent", parentListenerFn);
            scope.$emit("someEvent");
            expect(scopeListenerFn.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(parentListenerFn.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it ("Should attach targetScope on $broadcast", function () {
            var scopeListenerFn = jasmine.createSpy();
            var childListenerfn = jasmine.createSpy();
            scope.$on("someEvent", scopeListenerFn);
            child.$on("someEvent", childListenerfn);
            scope.$broadcast("someEvent");
            expect(scopeListenerFn.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(childListenerfn.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it ("Should attach currentScope on $emit", function () {
            var currentScopeOnScope;
            var currentScopeOnParent;
            var scopeListenerFn = function (event) {
                currentScopeOnScope = event.currentScope;
            };
            var parentListenerFn = function (event) {
                currentScopeOnParent = event.currentScope;
            };
            scope.$on("someEvent", scopeListenerFn);
            parent.$on("someEvent", parentListenerFn);
            scope.$emit("someEvent");
            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnParent).toBe(parent);
        });

        it ("Should attach currentScope on $broadcast", function () {
            var currentScopeOnScope;
            var currentScopeOnChild;
            var scopeListenerFn = function(event) {
                currentScopeOnScope = event.currentScope;
            };
            var childListenerFn = function(event) {
                currentScopeOnChild = event.currentScope;
            };
            scope.$on("someEvent", scopeListenerFn);
            child.$on("someEvent", childListenerFn);
            scope.$broadcast("someEvent");
            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnChild).toBe(child);
        });

        it ("Should not propagate the event to parents when stopped", function () {
            var scopeListenerFn = function (event) {
                event.stopPropagation();
            };
            var parentListenerFn = jasmine.createSpy();
            scope.$on("someEvent", scopeListenerFn);
            parent.$on("someEvent", parentListenerFn);
            scope.$emit("someEvent");
            expect(parentListenerFn).not.toHaveBeenCalled();
        });

        it ("Should be recieved by listeners on current scope after being stopped", function () {
            var listenerFn1 = function (event) {
                event.stopPropagation();
            };
            var listenerFn2 = jasmine.createSpy();
            scope.$on("someEvent", listenerFn1);
            scope.$on("someEvent", listenerFn2);
            scope.$emit("someEvent");
            expect(listenerFn2).toHaveBeenCalled();
        });

        it ("Should fire $destoy event when $destroy is called on $scope", function () {
            var listenerFn = jasmine.createSpy();
            scope.$on("$destroy", listenerFn);
            scope.$destroy();
            expect(listenerFn).toHaveBeenCalled();
        });

        it ("Should fire $destroy events on children when $destroy is called on $scope", function () {
            var listenerFn = jasmine.createSpy();
            child.$on("$destroy", listenerFn);
            scope.$destroy();
            expect(listenerFn).toHaveBeenCalled();
        });
    });
});