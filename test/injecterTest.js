/* jshint globalstrict: true */

"use strict";

describe('injector', function () {

    beforeEach(function () {
        delete window.angular;
        setupModuleLoader(window);
    });

    it ('Should be possible to create an injector', function () {
        var injector = createInjector([]);
        expect(injector).toBeDefined();
    });

});