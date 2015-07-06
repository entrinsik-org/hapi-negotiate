'use strict';

var hapi = require('hapi');
var should = require('chai').should();

describe('hapi-everafter', function () {
    var server;

    beforeEach(function () {
        server = new hapi.Server();
        server.connection();
    });

    beforeEach(function (done) {
        server.register(require('../../lib'), done);
    });

    beforeEach(function (done) {
        server.register(require('inject-then'), done);
    });

    it('should allow overriding output based on content type', function () {
        server.route({
            path: '/people/hank',
            method: 'get',
            config: {
                handler: function (req, reply) {
                    reply({ first: 'Hank', last: 'Leupen' });
                },
                plugins: {
                    negotiate: {
                        'text/plain': function (req, done) {
                            done('Hank is the best').type('text/plain');
                        }
                    }
                }
            }
        });

        return server.injectThen({
            url: '/people/hank',
            method: 'get',
            headers: {
                Accept: 'text/plain'
            }
        }).then(function (res) {
            res.statusCode.should.equal(200);
            res.headers['content-type'].split(';')[0].should.equal('text/plain');
            res.payload.should.equal('Hank is the best');
        });
    });

    it('should serve the original response if no suitable handler is found', function () {
        server.route({
            path: '/people/hank',
            method: 'get',
            config: {
                handler: function (req, reply) {
                    reply({ first: 'Hank', last: 'Leupen' });
                }
            }
        });

        return server.injectThen({
            url: '/people/hank',
            method: 'get',
            headers: {
                Accept: 'text/plain'
            }
        }).then(function (res) {
            res.statusCode.should.equal(200);
            res.headers['content-type'].split(';')[0].should.equal('application/json');
            JSON.parse(res.payload).should.deep.equal({ first: 'Hank', last: 'Leupen' });
        });
    });

    it('should serve the default json response if most appropriate', function () {
        server.route({
            path: '/people/hank',
            method: 'get',
            config: {
                handler: function (req, reply) {
                    reply({ first: 'Hank', last: 'Leupen' });
                },
                plugins: {
                    negotiate: {
                        'text/plain': function (req, done) {
                            done('Hank is the best').type('text/plain');
                        }
                    }
                }
            }
        });

        return server.injectThen({
            url: '/people/hank',
            method: 'get',
            headers: {
                Accept: 'application/json'
            }
        }).then(function (res) {
            res.statusCode.should.equal(200);
            res.headers['content-type'].split(';')[0].should.equal('application/json');
            JSON.parse(res.payload).should.deep.equal({ first: 'Hank', last: 'Leupen' });
        });
    });

    it('should decorate the server', function () {
        server.should.respondTo('negotiate');
    });

    it('should decorate an existing route', function () {
        server.route({
            path: '/people/hank',
            method: 'get',
            config: {
                id: 'hank',
                handler: function (req, reply) {
                    reply({ first: 'Hank', last: 'Leupen' });
                }
            }
        });

        server.negotiate('hank', {
            'text/plain': function (req, done) {
                done('Hank is the best').type('text/plain');
            }
        });

        return server.injectThen({
            url: '/people/hank',
            method: 'get',
            headers: {
                Accept: 'text/plain'
            }
        }).then(function (res) {
            res.statusCode.should.equal(200);
            res.headers['content-type'].split(';')[0].should.equal('text/plain');
            res.payload.should.equal('Hank is the best');
        });
    });

});