"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /**
   * Takes object and extracts minEmployees, maxEmployees, and name values.
   * Returns 
   *  - Object
   *    {where: "WHERE .....", pQueries: ["company name",....]} //TODO: Be more explicit WHERE
   *      - "where" key value is a string in form of an SQL query
   *      - "pQueries" key value is an array of parameterized queries
   */ //TODO: WHERE Clause for SQL query. Not the full query
//TODO: shouldnt directly use this method. Not useful for any other case than with findAll() "_"
  static getWhereFilters({ minEmployees, maxEmployees, name}) {
    let whereNames = []; //TODO: WhereParts. Multiple parts to a where clause
    let pQueries = [];
//TODO: pQueries => vals or values. Actual values like in SQL (VALUES)
    if(minEmployees) {
      pQueries.push(minEmployees);
      whereNames.push(`num_employees >= $${pQueries.length}`);
    }

    if(maxEmployees) {
      pQueries.push(maxEmployees);
      whereNames.push(`num_employees <= $${pQueries.length}`);
    }

    if(name) {
      pQueries.push(`%${name}%`);
      whereNames.push(`name ILIKE $${pQueries.length}`);
    }

    const where = whereNames.length > 0
      ? `WHERE ${whereNames.join(" AND ")}`
      : "";

    return { where, pQueries }
  }

  /** Find all companies based on filters.
   * Takes input of an object query. Default is an empty object as query. 
   * Passes the query object data to the class method getWhereFilters.  //TODO: What is does only
   * Makes a SQL query
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */ //TODO: filters is optional. Specify on what you can filter on. Options to filter

  static async findAll(query = {}) {
    const { minEmployees, maxEmployees, name } = query;

    console.log(query);

    if(minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be higher than max");
    }

    const { where, pQueries } = this.getWhereFilters(
      { minEmployees, maxEmployees, name }
    )

    const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${where}
           ORDER BY name`,
           pQueries);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    console.log(data, "<<<<<<<data")
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
