"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.Params = exports.Body = exports.Req = exports.argMapperDecor = exports.ErrorHandler = exports.ResponseHandler = void 0;
const api_1 = require("./api");
const _ = require("lodash");
__exportStar(require("./api"), exports);
__exportStar(require("./decors"), exports);
function ResponseHandler(handler) {
    return api_1.updateAPIInfo(api => {
        api.responseHandler = handler;
    });
}
exports.ResponseHandler = ResponseHandler;
function ErrorHandler(handler) {
    return api_1.updateAPIInfo(api => {
        api.errorHandler = handler;
    });
}
exports.ErrorHandler = ErrorHandler;
// Args
function argMapperDecor(arg) {
    return (target, key, index) => {
        api_1.updateAPI(target, key, (api) => {
            api.argMappers[index] = arg;
            if (index > api.nArgs) {
                api.nArgs = index;
            }
        });
    };
}
exports.argMapperDecor = argMapperDecor;
function Req(arg) {
    const mapper = _.isString(arg) ? req => _.get(req, arg) : (_.isFunction(arg) ? req => arg(req) : req => req);
    return argMapperDecor(mapper);
}
exports.Req = Req;
function Body(arg) {
    const mapper = _.isString(arg) ? req => _.get(req.body, arg) : (_.isFunction(arg) ? req => arg(req.body) : req => req.body);
    return argMapperDecor(mapper);
}
exports.Body = Body;
function Params(arg) {
    const mapper = _.isString(arg) ? req => _.get(req.params, arg) : (_.isFunction(arg) ? req => arg(req.params) : req => req.params);
    return argMapperDecor(mapper);
}
exports.Params = Params;
function Query(arg) {
    const mapper = _.isString(arg) ? req => _.get(req.query, arg) : (_.isFunction(arg) ? req => arg(req.query) : req => req.query);
    return argMapperDecor(mapper);
}
exports.Query = Query;
//# sourceMappingURL=decors.js.map