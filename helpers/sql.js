"use strict";

const { BadRequestError } = require("../expressError");

/**
 *  Takes in two objects
 *  - dataToUpdate: Object with updated data from database
 *  - jsToSql: Object with key as dataToUpdate key
 *             and value as SQL converted key
 *
 *  Returns an object like:
 *
 *  {
 *    setCols: '"first_name"=$1, "age"=$2'
 *    values: ['Aliya', 32]
 *  }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

