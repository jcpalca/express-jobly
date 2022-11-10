"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
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
      where: "WHERE equity == $1",
      values: [true]
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
      where: "WHERE salary >= $1 AND equity == $2 AND title ILIKE $3",
      values: [100000, true, "%Programmer%"]
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

  test("works: filter by hasEquity", async function () {
    const query = {
      "hasEquity": false
    };

    let jobs = await Job.findAll(query);

    expect(jobs).toEqual([
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
    let company = await Job.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Job.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM jobs
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Job.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM jobs
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("c1");
    const res = await db.query(
        "SELECT handle FROM jobs WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
