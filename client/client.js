"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var payload_1 = require("../common/payload");
var timers_1 = require("timers");
var rxjs_1 = require("rxjs");
var uuidv4 = require('uuid/v4');
var Client = /** @class */ (function () {
    function Client(url) {
        var _this = this;
        this.connected = new rxjs_1.BehaviorSubject(false);
        this.queue = [];
        this.message = new rxjs_1.Subject();
        this.working = false;
        console.log(1);
        this.url = url;
        this.id = uuidv4();
        try {
            this.connect();
            console.log(2);
        }
        catch (e) {
            console.log('FIRST CONNECT', e);
        }
        console.log(3);
        timers_1.setInterval(function () {
            // console.log('queue length', this.queue.length)
            if (!_this.working) {
                _this.working = true;
                if (!_this.connected.getValue()) {
                    try {
                        _this.connect();
                    }
                    catch (e) {
                        console.log('error connecting', e);
                    }
                    finally {
                        _this.working = false;
                    }
                }
                else {
                    if (true || _this.ws.readyState >= 1) {
                        for (var i = _this.queue.length - 1; i >= 0; i--) {
                            try {
                                _this.tryAndSend(_this.queue[0].id, _this.queue[0].payload);
                                _this.dequeue(_this.queue[0].id);
                            }
                            catch (e) {
                                console.log('couldn\'t send', _this.queue[0].payload, e);
                                _this.connected.next(false);
                            }
                        }
                    }
                    _this.working = false;
                }
            }
        }, 500);
    }
    Client.prototype.connect = function () {
        var _this = this;
        try {
            this.ws = new WebSocket(this.url);
            this.ws.on('open', function () {
                console.log('connection open');
                _this.connected.next(true);
                _this.ws.on('message', function (message) {
                    message = JSON.parse(message);
                    switch (message.op) {
                        case payload_1.OPS.NOOP:
                            try {
                                _this.send({
                                    id: message.id,
                                    op: payload_1.OPS.ACK,
                                    topic: message.topic
                                });
                            }
                            catch (e) {
                                console.log('NOOP', e);
                            }
                            break;
                        case payload_1.OPS.PUBLISH:
                            _this.message.next(message);
                            break;
                    }
                    // console.log('client Client received', message)
                });
            });
            this.ws.on('error', function (e) {
                console.log('error on connection attempt', e);
            });
        }
        catch (e) {
            console.log('error connecting', e);
        }
    };
    Client.prototype.dequeue = function (id) {
        for (var i = this.queue.length - 1; i >= 0; i--) {
            var m = this.queue[i];
            if (m.id === id) {
                this.queue.splice(i, 1);
            }
        }
    };
    Client.prototype.enqueue = function (payload) {
        this.queue.push({
            id: payload.id,
            payload: payload
        });
    };
    Client.prototype.tryAndSend = function (id, payload) {
        payload.id = id;
        this.ws.send(JSON.stringify(payload));
    };
    Client.prototype.send = function (payload) {
        // console.log('send', payload)
        this.enqueue(payload);
    };
    Client.prototype.publish = function (topic, message) {
        try {
            this.ws.send(JSON.stringify({
                id: uuidv4(),
                op: payload_1.OPS.PUBLISH,
                topic: topic,
                payload: message
            }));
        }
        catch (e) {
            console.log('PUBLISH', e);
        }
    };
    Client.prototype.subscribe = function (topic, groupId, startOffset) {
        try {
            this.send({
                id: uuidv4(),
                op: payload_1.OPS.SUBSCRIBE,
                topic: topic,
                subscriberId: this.id,
                consumerGroup: groupId,
                startOffset: startOffset
            });
        }
        catch (e) {
            console.log('SUBSCRIBE', e);
        }
    };
    return Client;
}());
exports.Client = Client;
