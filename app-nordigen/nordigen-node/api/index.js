"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "AccountApi", {
  enumerable: true,
  get: function () {
    return _account.default;
  }
});
Object.defineProperty(exports, "AgreementApi", {
  enumerable: true,
  get: function () {
    return _agreements.default;
  }
});
Object.defineProperty(exports, "InstitutionApi", {
  enumerable: true,
  get: function () {
    return _institutions.default;
  }
});
Object.defineProperty(exports, "RequisitionsApi", {
  enumerable: true,
  get: function () {
    return _requisition.default;
  }
});

var _institutions = _interopRequireDefault(require("./institutions.js"));

var _requisition = _interopRequireDefault(require("./requisition.js"));

var _agreements = _interopRequireDefault(require("./agreements.js"));

var _account = _interopRequireDefault(require("./account.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map