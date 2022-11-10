"use strict";

const { BadRequestError } = require("../expressError");

/**
 *  Takes in two objects
 *  - dataToUpdate: Object with updated data being sent to database
 *    - Looks like
 *      -  {
              name: 'New',
              description: 'New Description',
              numEmployees: null,
              logoUrl: null
            }
 * 
 *  - jsToSql: Object with key as dataToUpdate key
 *             and value as SQL converted key
 *    - Looks like
 *      - {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
          }
 *
 *  Returns an object like:
 * 
 * {
 *    setCols: '"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4'
 *    values: ['New', 'New Description', null, null ]
 *  }
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

