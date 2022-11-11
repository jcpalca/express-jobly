"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
// const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");
const db = require("../db");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login and ensure user is Admin
 * 
 * //   "pattern" : "0+([.][0-9]+)?|1([.]0)?" regex in Schema New 
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    {required: true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => {
      e.stack;
    });
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - salary
 * - title (will find case-insensitive, partial matches)
 * - hasEquity 
 *
 * Authorization required: none
 *
 * Check if salary data exists in query, change to Number type
 * Validate data from req query to the jobFilter Schema.
 */

router.get("/", async function (req, res, next) {
  const q = req.query;

  if(q.minSalary) q.minSalary = +q.minSalary;
  if(q.hasEquity) q.hasEquity = (q.hasEquity === 'true');

  const validator = jsonschema.validate(
    q,
    jobFilterSchema,
    {required: true}
  );

  if (!validator.valid) {
    const errs = validator.errors.map( e => e.stack );
    throw new BadRequestError(errs);
  }

  const jobs = await Job.findAll(q);
  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login and ensure user is Admin
 */

router.patch("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyUpdateSchema,
    {required:true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.handle, req.body);
  return res.json({ job });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login and ensure user is Admin
 */

router.delete("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  await Job.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});


module.exports = router;
