"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
// Possibly mock?

describe("create", function () {
  const newJob = {
    title: "Test",
    salary: 50000,
    equity: "0.5",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number)
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'Test'`);

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "Test",
        salary: 50000,
        equity: "0.5",
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** getWhereFilters */

describe("_getWhereFilters", function () {
  test("works: no filter", async function () {
    const filter = {};

    expect(Job._getWhereFilters(filter)).toEqual({
      where: "",
      values: []
    });
  });

  test("works: minSalary filter", async function () {
    const filter = {minSalary: 100000};

    expect(Job._getWhereFilters(filter)).toEqual({
      where: "WHERE salary >= $1",
      values: [100000]
    });
  });

  test("works: hasEquity filter", async function () {
    const filter = {hasEquity: true};

    expect(Job._getWhereFilters(filter)).toEqual({
      where: "WHERE equity > 0",
      values: []
    });
  });

  test("works: title filter", async function () {
    const filter = {title: "Programmer"};

    expect(Job._getWhereFilters(filter)).toEqual({
      where: "WHERE title ILIKE $1",
      values: ["%Programmer%"]
    });
  });

  test("works: all filters", async function () {
    const filter = {
      minSalary: 100000,
      hasEquity: true,
      title: "Programmer"
    }

    expect(Job._getWhereFilters(filter)).toEqual({
      where: "WHERE title ILIKE $1 AND salary >= $2 AND equity > 0",
      values: ["%Programmer%", 100000]
    })
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30000,
        equity: null,
        companyHandle: "c3",
      },
    ]);
  });

  /******************************************* findALL Filter Test */

  test("works: with filter of all choices", async function () {
    const query = {
      "title": "j1",
      "minSalary": 10000,
      "hasEquity": true,
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      }
    ]);
  });

  test("works: filter by title", async function () {
    const query = {
      "title": "j2"
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      }
    ]);
  });

  test("works: filter by minSalary", async function () {
    const query = {
      "minSalary": 20000
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30000,
        equity: null,
        companyHandle: "c3",
      }
    ]);
  });

  test("works: filter by hasEquity: True", async function () {
    const query = {
      "hasEquity": true
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      }
    ]);
  });

  test("works: filter by hasEquity: False (Show everything)", async function () {
    const query = {
      "hasEquity": false
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30000,
        equity: null,
        companyHandle: "c3",
      }
    ]);
  });

  test("works: Job title does not exist. Should return empty array.", async function () {
    const query = {
      "title": "Invisible"
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([]);
  });

  test("works: Filter with partial title", async function () {
    const query = {
      "title": "2"
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      }
    ]);
  })
});

/************************************** get */

describe("get", function () {

  test("works", async function () {
    console.log(jobIds, "<<<<<<<<<<<<<<<< Inside Test ");
    let job = await Job.get(jobIds[0]);
    expect(job).toEqual(
      {
        id: jobIds[0],
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      }
    );
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewJ",
    salary: "New Job Description",
    equity: "0.8"
  };

  test("works", async function () {
    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [jobIds[0]]);
    expect(result.rows).toEqual([{
      id: jobIds[0],
      title: "NewJ",
      salary: "New Job Description",
      equity: "0.8",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "NewJ",
      salary: null,
      equity: null
    };

    let job = await Job.update(jobIds[1], updateDataSetNulls);
    expect(job).toEqual({
      id: jobIds[1],
      companyHandle: "c2",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [jobIds[1]]);
    expect(result.rows).toEqual([{
      id: jobIds[1],
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c2"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[1], {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [jobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
