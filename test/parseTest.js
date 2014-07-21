/* jshint globalstrict: true */
/* global parse: false */
'use strict';

describe("Parse", function () {

    it ("Should be able to parse an integer", function () {
        var fn = parse('42');
        expect(fn).toBeDefined();
        expect(fn()).toBe(42);
    });

});