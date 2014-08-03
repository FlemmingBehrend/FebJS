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

});