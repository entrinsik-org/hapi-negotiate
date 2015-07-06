'use strict';

var _ = require('lodash');
var Negotiator = require('negotiator');

exports.register = function (server, opts, next) {
    server.ext('onPostHandler', function (request, next) {
        var route = request.route;
        var negotiate = _.get(route, 'settings.plugins.negotiate', {});

        if (Object.keys(negotiate).length === 0) return next.continue();

        var mediaType = new Negotiator(request).mediaType(Object.keys(negotiate));
        if (mediaType) {
            negotiate[mediaType](request, next);
        } else {
            next.continue();
        }
    });

    server.decorate('server', 'negotiate', function(routeId, handlers) {
        var route = server.lookup(routeId);
        if (!route) throw new Error('No route with id ' + routeId);
        route.settings.plugins.negotiate = _.assign({}, route.settings.plugins.negotiate, handlers);
    });
    next();
};

exports.register.attributes = { name: 'hapi-everafter' };