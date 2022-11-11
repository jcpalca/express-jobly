"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");
const db = require("../db");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login and ensure user is Admin
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
 * Check if minSalary data exists in query, change to Number type
 * Check if hasEquity data exists in query, change to Boolean type
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

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login and ensure user is Admin
 */

router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobUpdateSchema,
    {required:true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login and ensure user is Admin
 */

router.delete("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  req.params.id = +req.params.id;
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});


module.exports = router;
