/* jshint globalstrict: true */
'use strict';

function $QProvider() {
    
    this.$get = ['$rootScope', function ($rootScope) {

        function Promise() {
            this.$$state = {};
        }

        Promise.prototype.then = function (onFulfilled) {
            this.$$state.pending = onFulfilled;
            if (this.$$state.status > 0) {
                scheduleProcessQueue(this.$$state);
            }
        };

        function Deffered() {
            this.promise = new Promise();
        }

        Deffered.prototype.resolve = function (value) {
            if (this.promise.$$state.status) {
                return;
            }
            this.promise.$$state.value = value;
            this.promise.$$state.status = 1;
            scheduleProcessQueue(this.promise.$$state);
        };

        function scheduleProcessQueue(state) {
            $rootScope.$evalAsync(function () {
                processQueue(state);
            });
        }

        function processQueue(state) {
            state.pending(state.value);
        }

        function defer() {
            return new Deffered();
        }

        return {
            defer: defer
        }


    }];

}