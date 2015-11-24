/*jshint globalstrict: true*/
'use strict';
function $CompileProvider($provide) {
    this.$get = ['$injector', function($injector) {

        function compile($compileNodes) {
            return compileNodes($compileNodes);
        }

        function compileNodes($compileNodes) {
            _.forEach($compileNodes, function (node) {
                var directives = collectDirectives(node);
                var terminal = applyDirectivesToNode(directives, node);
                if (!terminal && node.childNodes && node.childNodes.length) {
                    compileNodes(node.childNodes);
                }
            })
        }

        function applyDirectivesToNode(directives, compiledNode) {
            var $compileNode = $(compiledNode);
            var terminalPriority = -Number.MAX_VALUE;
            var terminal = false;
            _.forEach(directives, function (directive) {
                if (directive.priority < terminalPriority) {
                    return false;
                }
                if (directive.compile) {
                    directive.compile($compileNode);
                }
                if (directive.terminal) {
                    terminal = true;
                    terminalPriority = directive.priority;
                }
            });
            return terminal;
        }

        function collectDirectives(node) {
            var directives = [];
            if (node.nodeType === Node.ELEMENT_NODE) {
                var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
                addDirective(directives, normalizedNodeName, 'E');
                _.forEach(node.attributes, function (attribute) {
                    var normalizedAttributeName = directiveNormalize(attribute.name.toLowerCase());
                    if (/^ngAttr[A-Z]/.test(normalizedAttributeName)) {
                        normalizedAttributeName =
                            normalizedAttributeName[6].toLowerCase() +
                            normalizedAttributeName.substring(7);
                    }
                    addDirective(directives, normalizedAttributeName, 'A');
                });
                _.forEach(node.classList, function (cls) {
                    var normalizedClassName = directiveNormalize(cls);
                    addDirective(directives, normalizedClassName, 'C');
                });
            } else if (node.nodeType === Node.COMMENT_NODE) {
                var match = /^\s*directive\:\s*([\d\w\-_]+)/.exec(node.nodeValue);
                if (match) {
                    addDirective(directives, directiveNormalize(match[1]), 'M');
                }
            }
            directives.sort(byPriority);
            return directives;
        }

        function addDirective(directives, name, mode) {
            if (hasDirectives.hasOwnProperty(name)) {
                var foundDirective = $injector.get(name + 'Directive');
                var applicableDirectives = _.filter(foundDirective, function (dir) {
                    return dir.restrict.indexOf(mode) !== -1;
                });
                directives.push.apply(directives, applicableDirectives);
            }
        }

        return compile;

    }];

    var hasDirectives = {};

    this.directive = function (name, directiveFactory) {
        if (_.isString(name)) {
            if (name == 'hasOwnProperty') {
                throw 'hasOwnProperty is not a valid directive name';
            }
            if (!hasDirectives.hasOwnProperty(name)) {
                hasDirectives[name] = [];
                $provide.factory(name + 'Directive', ['$injector', function ($injector) {
                    var factories = hasDirectives[name];
                    var map = _.map(factories, function (factory, i) {
                        var directive = $injector.invoke(factory);
                        directive.restrict = directive.restrict || 'EA';
                        directive.name = directive.name || name;
                        directive.priority = directive.priority || 0;
                        directive.index = i;
                        return directive;
                    });
                    return map;
                }]);
            }
            hasDirectives[name].push(directiveFactory);
        } else {
            _.forEach(name, function(directiveFactory, name) {
                this.directive(name, directiveFactory);
            }, this);
        }
    };

}

function nodeName(element) {
    return element.nodeName ? element.nodeName : element[0].nodeName;
}

var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;

function directiveNormalize(name) {
    return _.camelCase(name.replace(PREFIX_REGEXP, ''));
}

function byPriority(a, b) {
    var diff = b.priority - a.priority;
    if (diff !== 0) {
        return diff;
    } else {
        if (a.name !== b.name) {
            return (a.name < b.name ? -1 : 1);
        } else {
            return a.index - b.index;
        }
    }
}

$CompileProvider.inject = ['$provide'];
