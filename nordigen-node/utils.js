"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterObject = void 0;

/**
 * Filter false values from object
 * @param {Object} obj
 * @returns A new object with truthy values
*/
const filterObject = obj => {
  return Object.keys(obj || {}).reduce((acc, key) => {
    if (obj[key]) {
      acc[key] = obj[key];
    }

    return acc;
  }, {});
};

exports.filterObject = filterObject;
//# sourceMappingURL=utils.js.map