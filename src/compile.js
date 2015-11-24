/*jshint globalstrict: true*/
'use strict';
function $CompileProvider($provide) {

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
                    var map = _.map(factories, $injector.invoke);
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

    this.$get = ['$injector', function($injector) {

        function compile($compileNodes) {
            return compileNodes($compileNodes);
        }

        function compileNodes($compileNodes) {
            _.forEach($compileNodes, function (node) {
                var directives = collectDirectives(node);
                applyDirectivesToNode(directives, node);
                if (node.childNodes && node.childNodes.length) {
                    compileNodes(node.childNodes);
                }
            })
        }

        function applyDirectivesToNode(directives, compiledNode) {
            var $compileNode = $(compiledNode);
            _.forEach(directives, function (directive) {
                if (directive.compile) {
                    directive.compile($compileNode);
                }
            });
        }

        function collectDirectives(node) {
            var directives = [];
            var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
            addDirective(directives, normalizedNodeName);
            _.forEach(node.attributes, function (attribute) {
                var normalizedAttributeName = directiveNormalize(attribute.name.toLowerCase());
                if (/^ngAttr[A-Z]/.test(normalizedAttributeName)) {
                    normalizedAttributeName =
                        normalizedAttributeName[6].toLowerCase() +
                        normalizedAttributeName.substring(7);
                }
                addDirective(directives, normalizedAttributeName);
            });
            return directives;
        }

        function addDirective(directives, name) {
            if (hasDirectives.hasOwnProperty(name)) {
                directives.push.apply(directives, $injector.get(name + 'Directive'));
            }
        }

        return compile;

    }];

}

function nodeName(element) {
    return element.nodeName ? element.nodeName : element[0].nodeName;
}

var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;

function directiveNormalize(name) {
    return _.camelCase(name.replace(PREFIX_REGEXP, ''));
}

$CompileProvider.inject = ['$provide'];
