"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

const data = {
  "name": "Test",
  "age": 25,
  "isTired": true,
  "hadCoffee": false
}

const jsToSql = {
  "isTired": "is_tired",
  "hadCoffee": "had_coffee"
}

describe("sqlForPartialUpdate", function () {
  test("Returns correct object", function () {
    const result = sqlForPartialUpdate(data, jsToSql);

    expect(result).toEqual({
      setCols: '"name"=$1, "age"=$2, "is_tired"=$3, "had_coffee"=$4',
      values: [ 'Test', 25, true, false ]
    });
  });

  test("Throws error if no data is given", function () {
    expect(
      () => sqlForPartialUpdate({}, {})).toThrow(new BadRequestError("No data")
    );
  });
});
