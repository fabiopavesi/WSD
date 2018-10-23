"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var consumer_1 = require("./consumer");
var consumer_group_1 = require("./consumer-group");
var rxjs_1 = require("rxjs");
var ws_transport_1 = require("./ws-transport");
var Topic = /** @class */ (function () {
    function Topic(name) {
        var _this = this;
        this.payloads = [];
        this.consumers = [];
        this.groupConsumers = [];
        this.message = new rxjs_1.Subject();
        this.newConsumer = new rxjs_1.Subject();
        this.leavingConsumer = ws_transport_1.WSTranport.getInstance().leavingConsumer;
        this.name = name;
        this.leavingConsumer
            .subscribe(function (ws) {
            console.log('disconnected');
            for (var _i = 0, _a = _this.consumers; _i < _a.length; _i++) {
                var c = _a[_i];
                if (c.webSocket === ws) {
                    console.log('destroying consumer', c.subscriberId);
                    c.webSocket.terminate();
                    _this.consumers.slice(_this.consumers.indexOf(c), 1);
                }
            }
            for (var _b = 0, _c = _this.groupConsumers; _b < _c.length; _b++) {
                var g = _c[_b];
                for (var _d = 0, _e = g.consumers; _d < _e.length; _d++) {
                    var c = _e[_d];
                    if (c.webSocket === ws) {
                        console.log('destroying consumer', c.subscriberId);
                        c.webSocket.terminate();
                        g.consumers.slice(g.consumers.indexOf(c), 1);
                    }
                }
            }
        });
    }
    Topic.getTopic = function (name) {
        var found = false;
        for (var _i = 0, _a = Topic.topics; _i < _a.length; _i++) {
            var t = _a[_i];
            if (t.name === name) {
                found = true;
                return t;
            }
        }
        if (!found) {
            var topic = new Topic(name);
            Topic.topics.push(topic);
            return topic;
        }
    };
    Topic.prototype.getConsumer = function (id) {
        var matchingConsumers = this.consumers.filter(function (s) {
            return s.subscriberId === id;
        });
        if (!matchingConsumers || matchingConsumers.length === 0) {
            return null;
        }
        else {
            return matchingConsumers[0];
        }
    };
    Topic.prototype.getGroupConsumer = function (id) {
        var matchingGroups = this.groupConsumers.filter(function (g) { return g.id === id; });
        if (matchingGroups && matchingGroups.length > 0) {
            return matchingGroups[0];
        }
        else {
            return null;
        }
    };
    Topic.prototype.addConsumer = function (subscriberId, groupId, webSocket, startOffset) {
        if (groupId) {
            this.addGroupConsumer(subscriberId, groupId, webSocket, startOffset);
        }
        else {
            var consumer = this.getConsumer(subscriberId);
            if (!consumer) {
                this.consumers.push(new consumer_1.Consumer(subscriberId, webSocket, 0, this));
            }
            else {
                consumer.subscriberId = subscriberId;
                consumer.webSocket = webSocket;
                consumer.offset = startOffset || this.payloads.length - 1;
            }
        }
    };
    Topic.prototype.addGroupConsumer = function (subscriberId, groupId, webSocket, startOffset) {
        var group = this.getGroupConsumer(groupId);
        if (!group) {
            group = new consumer_group_1.ConsumerGroup(groupId, this);
            this.groupConsumers.push(group);
        }
        var consumer = group.getConsumer(subscriberId);
        if (consumer) {
            consumer.subscriberId = subscriberId;
            consumer.webSocket = webSocket;
            consumer.offset = startOffset || this.payloads.length - 1;
            consumer.inGroup = true;
        }
        else {
            group.addConsumer(new consumer_1.Consumer(subscriberId, webSocket, startOffset || this.payloads.length - 1, this, true));
        }
    };
    Topic.prototype.push = function (payload) {
        this.payloads.push(payload);
        console.log('topics', Topic.topics);
        this.dispatch();
    };
    Topic.prototype.removeConsumer = function (webSocket) {
        for (var i = this.consumers.length - 1; i >= 0; i--) {
            if (this.consumers[i].webSocket === webSocket) {
                this.consumers.splice(i, 1);
            }
        }
        for (var _i = 0, _a = this.groupConsumers; _i < _a.length; _i++) {
            var g = _a[_i];
            for (var i = g.consumers.length - 1; i >= 0; i--) {
                if (g.consumers[i].webSocket === webSocket) {
                    g.consumers.splice(i, 1);
                }
            }
        }
    };
    Topic.prototype.send = function (ws, payload) {
        try {
            // console.log('sending', payload)
            ws.send(JSON.stringify(payload));
        }
        catch (e) {
            this.removeConsumer(ws);
            console.log('error', JSON.stringify(e));
            throw 'couldn\'t send';
        }
    };
    Topic.prototype.dispatch = function () {
        for (var _i = 0, _a = this.consumers; _i < _a.length; _i++) {
            var s = _a[_i];
            for (var i = s.offset; i < this.payloads.length; i++) {
                this.payloads[i].offset = i;
                try {
                    this.send(s.webSocket, this.payloads[i]);
                }
                catch (e) {
                }
            }
            s.offset = this.payloads.length;
        }
    };
    Topic.topics = [];
    return Topic;
}());
exports.Topic = Topic;
