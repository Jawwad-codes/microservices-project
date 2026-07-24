const assert = require('assert');

function add(a, b) {
  return a + b;
}

describe('API Gateway Simple Tests', function () {
  it('should add two numbers correctly', function () {
    assert.strictEqual(add(2, 3), 5);
  });

  it('should return a number', function () {
    assert.strictEqual(typeof add(1, 1), 'number');
  });
});
