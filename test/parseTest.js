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
});