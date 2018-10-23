"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SENDING_INTERVAL = 10;
var ConsumerGroup = /** @class */ (function () {
    function ConsumerGroup(id, topic) {
        var _this = this;
        this.offset = -1;
        this.consumers = [];
        this.lastServed = -1;
        this.pending = [];
        this.usePending = false;
        this.id = id;
        this.topic = topic;
        this.topic.message.subscribe(function (message) {
            // console.log('consumer group', id, 'received', message.id)
            if (_this.usePending) {
                _this.pending.push({
                    sent: null,
                    payload: message
                });
            }
            else {
                var sent = false;
                var nextConsumer = _this.nextConsumer();
                while (!sent) {
                    var recipient = _this.consumers[nextConsumer];
                    if (recipient && recipient.webSocket) {
                        try {
                            console.log('sending', message.payload.value, 'to', nextConsumer);
                            _this.topic.send(recipient.webSocket, message);
                            sent = true;
                        }
                        catch (e) {
                        }
                    }
                }
            }
        });
        if (this.usePending) {
            setInterval(function () {
                if (_this.pending.length > 0) {
                    // console.log('pending first', this.pending[0], 'of', this.pending.length)
                    if (!_this.pending[0].sent) {
                        console.log('ready to send message', _this.pending[0].payload.id);
                        var nextConsumer = _this.nextConsumer();
                        var recipient = _this.consumers[nextConsumer];
                        if (recipient) {
                            _this.pending[0].sent = new Date();
                            try {
                                _this.topic.send(recipient.webSocket, _this.pending[0].payload);
                                _this.pending.splice(0, 1);
                            }
                            catch (e) {
                                console.log('couldn\'t deliver', _this.pending[0].payload.id);
                            }
                        }
                        else {
                            console.log('consumer not found', nextConsumer);
                        }
                    }
                    else {
                        if (_this.pending[0].received) {
                            _this.pending.splice(0, 1);
                        }
                    }
                }
            }, SENDING_INTERVAL);
        }
    }
    ConsumerGroup.prototype.nextConsumer = function () {
        this.lastServed++;
        if (this.lastServed >= this.consumers.length) {
            this.lastServed = 0;
        }
        return this.lastServed;
    };
    ConsumerGroup.prototype.addConsumer = function (consumer) {
        this.consumers.push(consumer);
    };
    ConsumerGroup.prototype.getConsumer = function (id) {
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
    return ConsumerGroup;
}());
exports.ConsumerGroup = ConsumerGroup;
