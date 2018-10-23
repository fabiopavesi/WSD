"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var consumer_1 = require("./consumer");
var fs_1 = require("fs");
var consumer1 = new consumer_1.Consumer('http://localhost:9898');
/*
for ( let i = 0; i < 2; i++ ) {
    consumer1.publish('test2', {
        text: '' + i
    })
}
*/
console.log(11);
var group = 'test';
var consumer2 = new consumer_1.Consumer('http://localhost:9898');
var consumer3 = new consumer_1.Consumer('http://localhost:9898');
consumer2.subscribe('test1', group, 0);
var total = 0;
var total2 = 0;
var total3 = 0;
var list2 = [];
var list3 = [];
var stream2 = fs_1.createWriteStream('stream2.txt', 'utf8');
var stream3 = fs_1.createWriteStream('stream3.txt', 'utf8');
consumer2.message.subscribe(function (payload) {
    total2++; // += payload.payload.value;
    stream2.write(payload.payload.value + '\n');
    // list2.push(payload.payload.value)
    console.log('consumer2 received', payload.payload.text);
});
console.log(12);
consumer3.subscribe('test1', group, 0);
consumer3.message.subscribe(function (payload) {
    total3++; // += payload.payload.value;
    stream3.write(payload.payload.value + '\n');
    // list3.push(payload.payload.value)
    console.log('consumer3 received', payload.payload.text);
});
console.log(13);
/*
const consumer4 = new Consumer('http://localhost:9898');
consumer4.subscribe('test1', null, 0)
consumer4.message.subscribe( (payload: IPayload) => console.log('consumer4 received', payload.payload.text))
*/
console.log(14);
function intersect(a, b) {
    var temp = [];
    for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
        var i1 = a_1[_i];
        for (var _a = 0, b_1 = b; _a < b_1.length; _a++) {
            var i2 = b_1[_a];
            if (i1 === i2) {
                temp.push(i1);
            }
        }
    }
    return temp;
}
function union(a, b) {
    return a.concat(b).sort();
}
function allNumbersPresent(a, b) {
    var unionValues = union(a, b);
    var temp = [];
    var previous = -1;
    for (var _i = 0, unionValues_1 = unionValues; _i < unionValues_1.length; _i++) {
        var u = unionValues_1[_i];
        if (u - previous <= 1) {
            temp.push(u);
        }
        previous = u;
    }
    return temp;
}
var i = 0;
setTimeout(function () {
    consumer1.connected
        .subscribe(function (connected) {
        if (connected) {
            /*
                            for (let i = 0; i < 1000000; i++) {
                                process.stdout.write('' + i + '\r')
                                consumer1.publish('test1', {
                                    text: '' + i,
                                    value: i
                                })
                            }
            */
            var interval_1 = setInterval(function () {
                process.stdout.write('' + i + '\r');
                consumer1.publish('test1', {
                    text: '' + i,
                    value: i
                });
                i++;
                if (i > 1000000) {
                    clearInterval(interval_1);
                }
            }, 1);
        }
    });
}, 1000);
/*setInterval( () => {
    try {
        consumer1.publish('test1', {
            text: '' + i,
            value: i
        })
        i++
        total = i

        if ( i > 100000 ) {
            stream2.end()
            stream3.end()
        }
/!*
        const temp = intersect(list2, list3)
        const allPresent = allNumbersPresent(list2, list3)
        process.stdout.write('total = ' + total + ' - ' + Math.round(total2 / total * 100.0) + '%, ' + Math.round(total3 / total * 100.0) + '%, intersection: ' + (temp.length) + ', union - missing: ' + allPresent.length + '\r')
*!/
    } catch (e) {
        console.log('error publishing', e)
    }
}, 1)*/
