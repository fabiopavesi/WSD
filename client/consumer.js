"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("./client");
var rxjs_1 = require("rxjs");
var Consumer = /** @class */ (function () {
    function Consumer(url) {
        var _this = this;
        this.message = new rxjs_1.Subject();
        this.connected = new rxjs_1.BehaviorSubject(false);
        this.client = new client_1.Client(url);
        this.client.message.subscribe(function (payload) { return _this.message.next(payload); });
        this.client.connected
            .subscribe(function (res) { return _this.connected.next(res); });
    }
    Consumer.prototype.subscribe = function (topic, groupId, startOffset) {
        this.client.subscribe(topic, groupId, startOffset);
    };
    Consumer.prototype.publish = function (topic, message) {
        this.client.publish(topic, message);
    };
    return Consumer;
}());
exports.Consumer = Consumer;
