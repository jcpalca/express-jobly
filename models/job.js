"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title
           FROM jobs
           WHERE title = $1
            AND salary = $2
            AND equity = $3
            AND company_handle = $4`,
      [title, salary, equity, companyHandle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(
        `Duplicate job: ${title}, ${salary}, ${equity}, ${companyHandle}`
      );

    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /**
   * Takes object and extracts minEmployees, maxEmployees, and name values.
   * - Looks like
   *    - {title: "title",
   *       minSalary: 1000,
   *       hasEquity: true }
   *
   * Returns
   *  - Object
   *    {where: "WHERE title ILIKE $1 AND equity > 0",
   *    values: ["title"]}
   *      - "where" key value is the WHERE clause for a SQL query
   *      - "values" key value is an array of parameterized queries
   */

  static _getWhereFilters({ title, minSalary, hasEquity }) {
    const whereParts = [];
    const values = [];

    if (title) {
      values.push(`%${title}%`);
      whereParts.push(`title ILIKE $${values.length}`);
    }

    if (minSalary) {
      values.push(minSalary);
      whereParts.push(`salary >= $${values.length}`);
    }

    if (hasEquity === true) {
      whereParts.push(`equity > 0`);
    }

    const where = whereParts.length > 0
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    return { where, values }
  }

  /** Find all jobs. Filters are optional.
   *    - Filter options taken as object in query
   *       - { title: "title",
   *           minSalary: 1000,
   *           hasEquity: true
   *          }
   *
   * Takes input of an object query. Default is an empty object as query.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findAll(query = {}) {
    const { title, minSalary, hasEquity } = query;


    const { where, values } = this._getWhereFilters(
      { title, minSalary, hasEquity }
    )

    console.log(where, " values:", values, "<<<<<<<<<< getWhereFilters")

    const jobsRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           ${where}
           ORDER BY id`,
      values);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *   //where company is [{ handle, name, num_employees, description, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    // companyHandle is not updatable
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
