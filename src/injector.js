/* jshint globalstrict: true */
/* global angular: false, HashMap: false */
"use strict";

function createInjector(modulesToLoad, strictDI) {

    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;
    var INSTANTIATING = {};
    var providerCache = {};
    var providerInjector = providerCache.$injector = createInternalInjector(providerCache, function () {
        throw 'Unknown provider: ' + path.join(' <- ');
    });
    var instanceCache = {};
    var instanceInjector = instanceCache.$injector = createInternalInjector(instanceCache, function (name) {
        var provider = providerInjector.get(name + 'Provider');
        return instanceInjector.invoke(provider.$get, provider);
    });
    var loadedModules = new HashMap();
    var path = [];

    strictDI = (strictDI === true);

    providerCache.$provide = {
        constant: function (key, value) {
            if (key === 'hasOwnProperty') {
                throw 'hasOwnProperty is not a valid constant name!';
            }
            providerCache[key] = value;
            instanceCache[key] = value;
        },
        provider: function (key, provider) {
            if (_.isFunction(provider)) {
                provider = providerInjector.instantiate(provider);
            }
            providerCache[key + 'Provider'] = provider;
        },
        factory: function (key, factoryFn, enforce) {
            this.provider(key, {$get: enforce === false ? factoryFn : enforceReturnValue(factoryFn)});
        },
        value: function (key, value) {
            this.factory(key, _.constant(value), false);
        },
        service: function (key, Contructor) {
            this.factory(key, function () {
                return instanceInjector.instantiate(Contructor);
            });
        },
        decorator: function (serviceName, decoratorFn) {
            var provider = providerInjector.get(serviceName + 'Provider');
            var original$get = provider.$get;
            provider.$get = function() {
                var instance = instanceInjector.invoke(original$get, provider);
                instanceInjector.invoke(decoratorFn, null, {$delegate: instance});
                return instance;
            }
        }
    };

    function enforceReturnValue(factoryFn) {
        return function () {
            var value = instanceInjector.invoke(factoryFn);
            if (_.isUndefined(value)) {
                throw 'factory must return a value';
            }
            return value;
        };
    }

    function createInternalInjector(cache, factoryFn) {

        function invoke(fn, self, locals) {
            var args = _.map(annotate(fn), function(token) {
                if (_.isString(token)) {
                    return locals && locals.hasOwnProperty(token) ? locals[token] : getService(token);
                } else {
                    throw 'Incorrect injection token! Expected a string, got ' + token;
                }
            });
            if (_.isArray(fn)) {
                fn = _.last(fn);
            }
            return fn.apply(self, args);
        }

        function instantiate(Type, locals) {
            var UnwrappedType = _.isArray(Type) ? _.last(Type) : Type;
            var instance = Object.create(UnwrappedType.prototype);
            invoke(Type, instance, locals);
            return instance;
        }

        function getService(name) {
            if (cache.hasOwnProperty(name)) {
                if (cache[name] === INSTANTIATING) {
                    throw new Error('Circular dependency found: ' + name + ' <- ' + path.join(' <- '));
                }
                return cache[name];
            } else {
                path.unshift(name);
                cache[name] = INSTANTIATING;
                try {
                    return (cache[name] = factoryFn(name));
                } finally {
                    path.shift();
                    if (cache[name] === INSTANTIATING) {
                        delete cache[name];
                    }
                }
            }
        }

        return {
            has: function (key) {
                return cache.hasOwnProperty(key) || providerCache.hasOwnProperty(key + 'Provider');
            },
            get: getService,
            invoke: invoke,
            annotate: annotate,
            instantiate: instantiate
        };

    }

    function annotate(fn) {
        if (_.isArray(fn)) {
            return fn.slice(0, fn.length - 1);
        } else if (fn.$inject) {
            return fn.$inject;
        } else if (!fn.length) {
            return [];
        } else {
            if (strictDI) {
                throw 'fn is not using explicit annotation and cannot be invoked in strict mode';
            }
            var source = fn.toString().replace(STRIP_COMMENTS, '');
            var argDeclaration = source.match(FN_ARGS);
            var map = _.map(argDeclaration[1].split(','), function (argName) {
                return argName.match(FN_ARG)[2];
            });
            return map;
        }
    }

    function runInvokeQueue(queue) {
        _.forEach(queue, function (invokeArgs) {
            var service = providerInjector.get(invokeArgs[0]);
            var method = invokeArgs[1];
            var args = invokeArgs[2];
            service[method].apply(service, args);
        });
    }

    var runBlocks = [];
    _.forEach(modulesToLoad, function loadModule(module) {
        if (!loadedModules.get(module)) {
            loadedModules.put(module, true);
            if (_.isString(module)) {
                var module = angular.module(module);
                _.forEach(module.requires, loadModule);
                runInvokeQueue(module._invokeQueue);
                runInvokeQueue(module._configBlocks);
                runBlocks = runBlocks.concat(module._runBlocks);
            } else if (_.isFunction(module) || _.isArray(module)) {
                runBlocks.push(providerInjector.invoke(module));
            }
        }
    });
    _.forEach(_.compact(runBlocks), function (runBlock) {
        instanceInjector.invoke(runBlock);
    });

    return instanceInjector;

}