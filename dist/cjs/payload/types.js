"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadType = void 0;
var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["ERROR"] = -1] = "ERROR";
    PayloadType[PayloadType["INIT"] = 1] = "INIT";
    PayloadType[PayloadType["PING"] = 2] = "PING";
    PayloadType[PayloadType["PONG"] = 3] = "PONG";
    PayloadType[PayloadType["MESSAGE"] = 4] = "MESSAGE";
})(PayloadType || (exports.PayloadType = PayloadType = {}));
