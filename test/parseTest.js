/* jshint globalstrict: true */
/* global parse: false */
'use strict';

describe("Parse", function () {

    it ("Should be able to parse an integer", function () {
        var fn = parse('42');
        expect(fn).toBeDefined();
        expect(fn()).toBe(42);
    });

    it ("is so that integers is both a literal and a constant", function () {
        var fn = parse('42');
        expect(fn.constant).toBe(true);
        expect(fn.literal).toBe(true);
    });

    it ("Should be possible to parse floating point numbers", function () {
        var fn = parse('4.2');
        expect(fn()).toBe(4.2);
    });

    it ("Should be possible to parse a floating point number without an integer part", function () {
        var fn = parse('.42');
        expect(fn()).toBe(0.42);
    });

    it ("Should be possible to parse scientific notations", function () {
        var fn = parse('42e3');
        expect(fn()).toBe(42000);
    });

    it ("Should be possivle to parse scientific notations wiout an integer part", function () {
        var fn = parse('.42e3');
        expect(fn()).toBe(420);
    });

    it ("Should be possible to parse scientific notations with negative exponents", function () {
        var fn = parse('4200e-2');
        expect(fn()).toBe(42);
    });

    it ("Should be possible to parse scientific notations with positive exponents", function () {
        var fn = parse('.42e+2');
        expect(fn()).toBe(42);
    });

    it ("Should be possible to parse scientific notations that uses uppercase", function () {
        var fn = parse('.42E3');
        expect(fn()).toBe(420);
    });

    it ("Should throw an exception if scientific notation is invalid", function () {
        expect(function() { parse('42e-'); }).toThrow();
        expect(function() { parse('42e-a'); }).toThrow();
    });

    it ("Should be possible to parse a string in single quotes", function () {
        var fn = parse("'abc'");
        expect(fn()).toEqual('abc');
    });

    it ("Should be possible to parse a string in double quotes", function () {
        var fn = parse('"abc"');
        expect(fn()).toEqual("abc");
    });

    it ("Should not parse a string with mismatching quotes", function () {
        expect(function () { parse("'abc\""); }).toThrow();
    });

    it ("Should mark strings as literal and constant", function() {
        var fn = parse('"abc"');
        expect(fn.literal).toBe(true);
        expect(fn.constant).toBe(true);
    });

    it ("Should parse a string with character escapes", function () {
        var fn = parse('"\\n\\r\\\\"');
        expect(fn()).toEqual("\n\r\\");
    });

    it ("Should parse a string with unicode escapes", function () {
        var fn = parse('"\\u00A0"');
        expect(fn()).toEqual("\u00A0");
    });

    it ("Should parse a string with unicode escapes and other characters", function () {
        var fn = parse('"123 \\u00A0 456"');
        expect(fn()).toEqual('123 \u00a0 456');
    });

    it ("Should not parse a string with invalid unicode escapes", function () {
        expect(function () {parse("'\\u00T0'");}).toThrow();
    });

    it ("Should parse null", function () {
        var fn = parse("null");
        expect(fn()).toBeNull();
    });

    it ("Should parse true", function () {
        var fn = parse("true");
        expect(fn()).toBeTruthy();
    });

    it ("Should parse false", function () {
        var fn = parse("false");
        expect(fn()).toBeFalsy();
    });

    it ("Should ignore whitespaces", function () {
        var fn = parse(" \n42 ");
        expect(fn()).toEqual(42);
    });

    it ("Should parse an empty array", function () {
        var fn = parse("[]");
        expect(fn()).toEqual([]);
    });

    it ("Should parse a non-empty array", function () {
        var fn = parse("[1, 'two', [3]]");
        expect(fn()).toEqual([1, "two", [3]]);
    });

    it ("Should parse an array with trailing commas", function () {
        var fn = parse("[1, 2, 3, ]");
        expect(fn()).toEqual([1,2,3]);
    });

    it ("Should mark array literals as literal and constant", function () {
        var fn = parse("[1,2,3]");
        expect(fn.literal).toBeTruthy();
        expect(fn.constant).toBeTruthy();
    });

    it ("Should parse an empty object", function () {
        var fn = parse("{}");
        expect(fn()).toEqual({});
    });

    it ("Should parse a non-empty object", function () {
        var fn = parse("{a: 1, b: [2,3], c: {d: 4}}");
        expect(fn()).toEqual({a: 1, b: [2,3], c: {d: 4}});
    });

    it ("Should parse objects with string keys", function () {
        var fn = parse('{"a key": 1, \'another-key\': 2}');
        expect(fn()).toEqual({'a key': 1, 'another-key': 2});
    });

    it ("Should return the function itself if given one", function () {
        var fn = function () {
        };
        expect(parse(fn)).toBe(fn);
    });

    it ("Should return a function if given no argument", function () {
        expect(parse()).toEqual(jasmine.any(Function));
    });

    it ("Should be possible to look up a variable on the scope", function () {
        var fn = parse("aKey");
        expect(fn({aKey: 42})).toBe(42);
        expect(fn({})).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it ("Should be possible to look up 'dotted' variables on the scope", function () {
        var fn = parse("aKey.anotherKey");
        expect(fn({aKey: {anotherKey: 42}})).toBe(42);
        expect(fn({aKey: {}})).toBeUndefined();
        expect(fn({})).toBeUndefined();
    });

    it ("Should be possible go down 4 dots in variables on the scope", function () {
        var fn = parse("aKey.secondKey.thirdKey.fourthKey");
        expect(fn({aKey: {secondKey: {thirdKey: {fourthKey: 42}}}})).toBe(42);
        expect(fn({aKey: {secondKey: {thirdKey: {}}}})).toBeUndefined();
        expect(fn({aKey: {}})).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it ("Should use locals instead of scope when there is a matching key", function () {
        var fn = parse("aKey");
        expect(fn({aKey: 42}, {aKey: 43})).toBe(43);
    });

    it ("Should not use locals when there is not a matching key", function () {
        var fn = parse("aKey");
        expect(fn({aKey: 42}, {anotherKey: 43})).toBe(42);
    });

    it ("Should use locals when a 2-part key matches in locals", function() {
        var fn = parse("aKey.anotherKey");
        expect(fn(
            {aKey: {anotherKey: 42}},
            {aKey: {anotherKey: 43}}
        )).toBe(43);
    });

    it ("Should not use locals when a 2-part key does not match", function() {
        var fn = parse("aKey.anotherKey");
        expect(fn(
            {aKey: {anotherKey: 42}},
            {otherKey: {anotherKey: 43}}
        )).toBe(42);
    });

    it ("Should use locals instead of scope when the first part matches", function() {
        var fn = parse("aKey.anotherKey");
        expect(fn({aKey: {anotherKey: 42}}, {aKey: {}})).toBeUndefined();
    });
    it ("Should use locals when there is a matching local 4-part key", function() {
        var fn = parse("aKey.key2.key3.key4");
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {aKey: {key2: {key3: {key4: 43}}}}
        )).toBe(43);
    });

    it ("Should use locals when there is the first part in the local key", function() {
        var fn = parse("aKey.key2.key3.key4");
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {aKey: {}}
        )).toBeUndefined();
    });

    it ("Should not use locals when there is no matching 4-part key", function() {
        var fn = parse("aKey.key2.key3.key4");
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {otherKey: {anotherKey: 43}}
        )).toBe(42);
    });

    it ("Should be possible to parse simple string property access", function () {
        var fn = parse("aKey['anotherKey']");
        expect(fn({aKey: {anotherKey: 42}})).toBe(42);
    });

    it ("Should be possible to parse numeric array access", function () {
        var fn = parse("anArray[1]");
        expect(fn({anArray: [1,2,3]})).toBe(2);
    });

    it ("Should be possible to parse property access with another key as property", function () {
        var fn = parse("lock[key]");
        expect(fn({key: "theKey", lock: {theKey: 42}})).toBe(42);
    });

    it ("Should be possible to parse property access with another access as property", function () {
        var fn = parse("lock[keys['aKey']]");
        expect(fn({keys: {aKey: "theKey"}, lock: {theKey: 42}})).toBe(42);
    });

    it ("Should be possible to parse several field accesses back to back", function () {
        var fn = parse("aKey['anotherKey']['aThirdKey']");
        expect(fn({aKey: {anotherKey: {aThirdKey: 42}}})).toBe(42);
    });

    it ("Should be possible to parse a field access after a property access", function () {
        var fn = parse("aKey['anotherKey'].aThirdKey");
        expect(fn({aKey: {anotherKey: {aThirdKey: 42}}})).toBe(42);
    });

    it ("Should be possible to parse a chain of property and field accesses", function () {
        var fn = parse("aKey['anotherKey'].aThirdKey['aFourthKey']");
        expect(fn({aKey: {anotherKey: {aThirdKey: {aFourthKey: 42}}}})).toBe(42);
    });

    it ("Should be possible to parse function calls", function () {
        var fn = parse('aFunction()');
        expect(fn({aFunction: function() { return 42; }})).toBe(42);
    });

    it ("Should be possible to parse a function call with a single number argument", function () {
        var fn = parse('aFunction(42)');
        expect(fn({aFunction: function(n) { return n; }})).toBe(42);
    });

    it ("Should be possible to parse a function call with a single identifier argument", function () {
        var fn = parse('aFunction(n)');
        var scopeObj = {
            n: 42,
            aFunction: function (arg) {
                return arg;
            }
        };
        expect(fn(scopeObj)).toBe(42);
    });

    it ("Should be possible to parse a function call with a single function call argument", function () {
        var fn = parse('aFunction(objFn())');
        var scopeObj = {
            objFn: _.constant(42),
            aFunction: function (arg) {
                return arg;
            }
        };
        expect(fn(scopeObj)).toBe(42);
    });

    it ("Should be possible to parse a function call with multiple arguments", function () {
        var fn = parse('aFunction(37, n, objFn())');
        var scopeObj = {
            n: 3,
            objFn:_.constant(2),
            aFunction: function (a1, a2, a3) {
                return a1 + a2 + a3;
            }
        };
        expect(fn(scopeObj)).toBe(42);
    });

    it ("Should not be allowed to call a functions constructor", function () {
        expect(function () {
            var fn = parse("aFunction.constructor(' return window; ')()");
            fn({aFunction: function() {}});
        }).toThrow();
    });

    it ("Should call functions accessed as properties with the correct 'this'", function () {
        var scopeObj = {
            anObject: {
                aMember: 42,
                aFunction: function () {
                    return this.aMember;
                }
            }
        };
        var fn = parse("anObject['aFunction']()");
        expect(fn(scopeObj)).toBe(42);
    });

    it ("Should call functions accessed as fields with the correct 'this'", function () {
        var scopeObj = {
            anObject: {
                aMember: 42,
                aFunction: function () {
                    return this.aMember;
                }
            }
        };
        var fn = parse("anObject.aFunction()");
        expect(fn(scopeObj)).toBe(42);
    });

    it ("Should be possible to have whitespace before function call", function() {
        var scope = {
            anObject: {
                aMember: 42,
                aFunction: function() {
                    return this.aMember;
                }
            }
        };
        var fn = parse("anObject.aFunction ()");
        expect(fn(scope)).toBe(42);
    });

    it ("Should clear the 'this' context on function calls", function () {
        var scopeObj = {
            anObject: {
                aMember: 42,
                aFunction: function () {
                    return function () {
                        return this.aMember;
                    }
                }
            }
        };
        var fn = parse("anObject.aFunction()()");
        expect(fn(scopeObj)).toBeUndefined();
    });

    it ("Should not allow accessing window as property", function () {
        var fn = parse("anObject['wnd']");
        expect(function () { fn({anObject: {wnd: window}}); }).toThrow();
    });

    it ("Should not be allowed to call a function on window", function () {
        var fn = parse("wnd.scroll(500,0)");
        expect(function (){ fn({wnd: window}); }).toThrow();
    });

    it ("Should not be allowed to call functions that return window", function () {
        var fn = parse("getWnd()");
        expect(function () { fn({getWnd: _.constant(window)}); }).toThrow();
    });

    it ("Should not be allowed to call functions on DOM elements", function () {
        var fn = parse("e1.setAttribute('evil', 'true')");
        expect(function () { fn({e1: document.documentElement}); }).toThrow();
    });

    it ("Should not be allowed to call an aliased function constructor", function () {
        var fn = parse("fnConstructor('return window;')");
        expect(function () { fn({fnConstructor: (function () {}).constructor}); }).toThrow();
    });

    it ("Should not be allowed to call functions on Object", function () {
        var fn = parse("obj.create({})");
        expect(function () { fn({obj: Object}); }).toThrow();
    });

    it ("Should not be allowed to call the method 'call'", function () {
        var fn = parse("fun.call(obj)");
        expect(function () {
            fn({
                fun: function() {},
                obj: {}
            })
        }).toThrow();
    });

    it ("Should not be allowed to call the method 'apply'", function () {
        var fn = parse("fun.apply(obj)");
        expect(function () {
            fn({
                fun: function() {},
                obj: {}
            })
        }).toThrow();
    });

    it ("Should not be allowed to call the method 'bind'", function () {
        var fn = parse("fun.bind(obj)");
        expect(function () {
            fn({
                fun: function() {},
                obj: {}
            })
        }).toThrow();
    });

    it ("Should be possible to put an attribute on the scope", function () {
        var fn = parse("anAttribute = 42");
        var scope = {};
        fn(scope);
        expect(scope.anAttribute).toBe(42);
    });

    it ("Should be possible to assign an attribute through a function call on the scope", function () {
        var fn = parse("anAttribute = aFunction()");
        var scope = {
            aFunction: _.constant(42)
        };
        fn(scope);
        expect(scope.anAttribute).toBe(42);
    });

    it ("Should be possible to assign nested attributes on the scope", function () {
        var fn = parse("anObject.anAttribute = 42");
        var scope = {anObject: {}};
        fn(scope);
        expect(scope.anObject.anAttribute).toBe(42);
    });

    it ("Should craate nested object on the scope that does not exists", function () {
        var fn = parse("a.b.c.d = 42");
        var scope = {};
        fn(scope);
        expect(scope.a.b.c.d).toBe(42);
    });

    it ("Should create an assignment through attribute access", function() {
        var fn = parse("anObject['anAttribute'] = 42");
        var scope = {anObject: {}};
        fn(scope);
        expect(scope.anObject.anAttribute).toBe(42);
    });

    it ("Should parse assignment through field access after something else", function() {
        var fn = parse("anObject['otherObject'].nested = 42");
        var scope = {anObject: {otherObject: {}}};
        fn(scope);
        expect(scope.anObject.otherObject.nested).toBe(42);
    });

    it ("Should parse an array with non-literals", function() {
        var fn = parse("[a, b, c()]");
        expect(fn({a: 1, b: 2, c: _.constant(3)})).toEqual([1, 2, 3]);
    });

    it ("Should parse an object with non-literals", function() {
        var fn = parse("{a: a, b: obj.c()}");
        expect(fn({
            a: 1,
            obj: {
                b: _.constant(2),
                c: function() {
                    return this.b();
                }
            }
        })).toEqual({a: 1, b: 2});
    });

    it ("Should make an array a constant when it only contains constants", function() {
        var fn = parse("[1, 2, [3, 4]]");
        expect(fn.constant).toBe(true);
    });

    it ("Should make an array a non-constant when it contain non-constants", function() {
        expect(parse("[1, 2, a]").constant).toBe(false);
        expect(parse("[1, 2, [[[[[a]]]]]]").constant).toBe(false);
    });

    it ("Should make an object a constant when it only contain constants", function() {
        var fn = parse("{a: 1, b: {c: 3}}");
        expect(fn.constant).toBe(true);
    });

    it ("Should make an object a non-constant when it contain non-constants", function() {
        expect(parse("{a: 1, b: c}").constant).toBe(false);
        expect(parse("{a: 1, b: {c: d}}").constant).toBe(false);
    });

    it("Should allow an array element to be an assignment", function() {
        var fn = parse("[a = 1]");
        var scope = {};
        expect(fn(scope)).toEqual([1]);
        expect(scope.a).toBe(1);
    });

    it ("Should allow an object value to be an assignment", function() {
        var fn = parse("{a: b = 1}");
        var scope = {};
        expect(fn(scope)).toEqual({a: 1});
        expect(scope.b).toBe(1);
    });

    it ("Should parse +", function () {
        expect(parse('+42')()).toBe(42);
        expect(parse('+a')({a:42})).toBe(42);
    });

    it ("Should parse !", function () {
        expect(parse('!true')()).toBe(false);
        expect(parse('!42')()).toBe(false);
        expect(parse('!a')({a:false})).toBe(true);
        expect(parse('!!a')({a:false})).toBe(false);
    });

    it ("Should parse negated value as constants if value is constant", function () {
        expect(parse('!true').constant).toBe(true);
        expect(parse('!!true').constant).toBe(true);
        expect(parse('!a').constant).toBeFalsy();

    });

    it ("Should parse -", function () {
        expect(parse('-42')()).toBe(-42);
        expect(parse('-a')({a:-42})).toBe(42);
        expect(parse('--a')({a:-42})).toBe(-42);
    });

    it ("Should parse numerically negated numbers as constant if needed", function () {
        expect(parse('-42').constant).toBe(true);
        expect(parse('-a').constant).toBeFalsy();
    });

    it ('fills missing value in unary - with zero', function() {
        expect(parse('-a')()).toBe(0);
    });

    it ('parses a multiplication', function() {
        expect(parse('21 * 2')()).toBe(42);
    });

    it ('parses a division', function() {
        expect(parse('84 / 2')()).toBe(42);
    });

    it ('parses a remainder', function() {
        expect(parse('85 % 43')()).toBe(42);
    });

    it ('parses several multiplicatives', function() {
        expect(parse('36 * 2 % 5')()).toBe(2);
    });

    it ('parses an addition', function() {
        expect(parse('20 + 22')()).toBe(42);
    });

    it ('parses a subtraction', function() {
        expect(parse('42 - 22')()).toBe(20);
    });

    it ('parses multiplicatives on a higher precedence than additives', function() {
        expect(parse('2 + 3 * 5')()).toBe(17);
        expect(parse('2 + 3 * 2 + 3')()).toBe(11);
    });

    it ('treats a missing subtraction operand as zero', function() {
        expect(parse('a - b')({a: 20})).toBe(20);
        expect(parse('a - b')({b: 20})).toBe(-20);
        expect(parse('a - b')({})).toBe(0);
    });

    it ('treats a missing addition operand as zero', function() {
        expect(parse('a + b')({a: 20})).toBe(20);
        expect(parse('a + b')({b: 20})).toBe(20);
    });

    it ('returns undefined from addition when both operands missing', function() {
        expect(parse('a + b')()).toBeUndefined();
    });

    it ('parses relational operators', function() {
        expect(parse('1 < 2')()).toBe(true);
        expect(parse('1 > 2')()).toBe(false);
        expect(parse('1 <= 2')()).toBe(true);
        expect(parse('2 <= 2')()).toBe(true);
        expect(parse('1 >= 2')()).toBe(false);
        expect(parse('2 >= 2')()).toBe(true);
    });

    it ('parses equality operators', function() {
        expect(parse('42 == 42')()).toBe(true);
        expect(parse('42 == "42"')()).toBe(true);
        expect(parse('42 != 42')()).toBe(false);
        expect(parse('42 === 42')()).toBe(true);
        expect(parse('42 === "42"')()).toBe(false);
        expect(parse('42 !== 42')()).toBe(false);
    });

    it ('parses relationals on a higher precedence than equality', function() {
        expect(parse('2 == "2" > 2 === "2"')()).toBe(false);
    });

    it ('parses logical AND', function() {
        expect(parse('true && true')()).toBe(true);
        expect(parse('true && false')()).toBe(false);
    });

    it ('parses logical OR', function() {
        expect(parse('true || true')()).toBe(true);
        expect(parse('true || false')()).toBe(true);
        expect(parse('false || false')()).toBe(false);
    });

    it ('parses multiple ANDs', function() {
        expect(parse('true && true && true')()).toBe(true);
        expect(parse('true && true && false')()).toBe(false);
    });

    it ('parses multiple ORs', function() {
        expect(parse('true || true || true')()).toBe(true);
        expect(parse('true || true || false')()).toBe(true);
        expect(parse('false || false || true')()).toBe(true);
        expect(parse('false || false || false')()).toBe(false);
    });

    it ('short-circuits AND', function() {
        var invoked;
        var scope = {fn: function() { invoked = true; }};
        parse('false && fn()')(scope);
        expect(invoked).toBeUndefined();
    });

    it ('short-circuits OR', function() {
        var invoked;
        var scope = {fn: function() { invoked = true; }};
        parse('true || fn()')(scope);
        expect(invoked).toBeUndefined();
    });

    it ('parses AND with a higher precedence than OR', function() {
        expect(parse('false && true || true')()).toBe(true);
    });

    it ('parses OR with a lower precedence than equality', function() {
        expect(parse('1 === 2 || 2 === 2')()).toBeTruthy();
    });

    it ('parses the ternary expression', function() {
        expect(parse('a === 42 ? true : false')({a: 42})).toBe(true);
        expect(parse('a === 42 ? true : false')({a: 43})).toBe(false);
    });

    it ('parses OR with a higher precedence than ternary', function() {
        expect(parse('0 || 1 ? 0 || 2 : 0 || 3')()).toBe(2);
    });

    it ('parses nested ternaries', function() {
        expect(
            parse('a === 42 ? b === 42 ? "a and b" : "a" : c === 42 ? "c" : "none"')({
                a: 44,
                b: 43,
                c: 42
            })).toEqual('c');
    });

    it ('makes ternaries constants if their operands are', function() {
        expect(parse('true ? 42 : 43').constant).toBeTruthy();
        expect(parse('true ? 42 : a').constant).toBeFalsy();
    });

    it ('parses parentheses altering precedence order', function() {
        expect(parse('21 * (3 - 1)')()).toBe(42);
        expect(parse('false && (true || true)')()).toBe(false);
        expect(parse('-((a % 2) === 0 ? 1 : 2)')({a: 42})).toBe(-1);
    });

    it ('parses several statements', function() {
        var fn = parse('a = 1; b = 2; c = 3');
        var scope = {};
        fn(scope);
        expect(scope).toEqual({a: 1, b: 2, c: 3});
    });

    it ('returns the value of the last statement', function() {
        expect(parse('a = 1; b = 2; a + b')({})).toBe(3);
    });

});