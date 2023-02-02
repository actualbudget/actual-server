/** @returns {string | null} */
exports.getKey = function getKey(req, key) {
  let { body } = req;
  if (body == null) {
    return null;
  }
  let value = body[key];
  if (value == null || value === '') {
    return null;
  }
  return value;
};
