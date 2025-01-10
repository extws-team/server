export var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["ERROR"] = -1] = "ERROR";
    PayloadType[PayloadType["INIT"] = 1] = "INIT";
    PayloadType[PayloadType["PING"] = 2] = "PING";
    PayloadType[PayloadType["PONG"] = 3] = "PONG";
    PayloadType[PayloadType["MESSAGE"] = 4] = "MESSAGE";
})(PayloadType || (PayloadType = {}));
