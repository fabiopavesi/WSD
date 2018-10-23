"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Consumer = /** @class */ (function () {
    function Consumer(subscriberId, webSocket, startOffset, topic, inGroup) {
        var _this = this;
        this.inGroup = false;
        this.pending = [];
        console.log('creating consumer', subscriberId);
        this.subscriberId = subscriberId;
        this.webSocket = webSocket;
        this.offset = startOffset;
        this.topic = topic;
        this.inGroup = inGroup || false;
        if (!this.inGroup) {
            this.topic.message.subscribe(function (message) {
                console.log('consumer', subscriberId, 'received', message);
                _this.topic.send(_this.webSocket, message);
            });
        }
    }
    return Consumer;
}());
exports.Consumer = Consumer;
