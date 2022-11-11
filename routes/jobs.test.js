"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "j4",
    salary: 40000,
    equity: "0.4",
    companyHandle: "c1",
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(
      { job:
        {
          id: expect.any(Number),
          title: "j4",
          salary: 40000,
          equity: "0.4",
          companyHandle: "c1",
        }
      });
  })

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  //TODO: add test about nonadmin user making bad request should be unauth
  //TODO: add test about anon users should be unauth

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 150000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "a billion dollars",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: jobIds[0],
              title: "j1",
              salary: 10000,
              equity: "0.1",
              companyHandle: "c1",
            },
            {
              id: jobIds[1],
              title: "j2",
              salary: 20000,
              equity: "0.2",
              companyHandle: "c2",
            },
            {
              id: jobIds[2],
              title: "j3",
              salary: 30000,
              equity: null,
              companyHandle: "c3",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("fails: Bad Input", async function() {
    const resp = await request(app)
        .get("/jobs")
        .query({
          salary: "kajillion dollars"
        });

    expect(resp.statusCode).toEqual(400);
  })

  /******************************************* GET /jobs Filters */

  test("returns filtered title from jobs", async function() {
    //Filter jobs. Return filtered jobs

    const resp = await request(app)
        .get("/jobs")
        .query({
          title: "j1"
        });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {jobs : [{
        id: jobIds[0],
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
                    }]
      });
  });

  test("returns filtered minSalary from jobs", async function() {
    //Filter jobs. Return filtered jobs

    const resp = await request(app)
        .get("/jobs")
        .query({
          minSalary: 20000
        });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {jobs:
        [{
          id: jobIds[1],
          title: "j2",
          salary: 20000,
          equity: "0.2",
          companyHandle: "c2",
          },
          {
          id: jobIds[2],
          title: "j3",
          salary: 30000,
          equity: null,
          companyHandle: "c3",
          }]});
  });

  test("returns filtered hasEquity from jobs: true", async function() {
    //Filter jobs. Return filtered jobs

    const resp = await request(app)
        .get("/jobs")
        .query({
          hasEquity: true
        });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {jobs:
        [{
          id: jobIds[0],
          title: "j1",
          salary: 10000,
          equity: "0.1",
          companyHandle: "c1",
          },
          {
          id: jobIds[1],
          title: "j2",
          salary: 20000,
          equity: "0.2",
          companyHandle: "c2",
          }]});
  });

  test("returns filtered hasEquity from jobs: false", async function() {
    //Filter jobs. Return filtered jobs

    const resp = await request(app)
        .get("/jobs")
        .query({
          hasEquity: false
        });

    console.log(resp.body, "<<<<<<<<<filter hasEquity Test")
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {jobs:
        [{
            id: jobIds[0],
            title: "j1",
            salary: 10000,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: jobIds[1],
            title: "j2",
            salary: 20000,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: jobIds[2],
            title: "j3",
            salary: 30000,
            equity: null,
            companyHandle: "c3",
          }
        ]
      });
  });

  test("returns jobs filtering all", async function() {
    const resp = await request(app)
        .get("/jobs")
        .query({
          title: "j2",
          minSalary: 20000,
          hasEquity: true
        });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {jobs : [{
        id: jobIds[1],
        title: "j2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
                    }]
    });
  });

  // TODO: write test about nonexistent filter
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "j1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  // test("works for anon: job w/o jobs", async function () {
  //   const resp = await request(app).get(`/jobs/j2`);
  //   expect(resp.body).toEqual({
  //     job: {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //   });
  // });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for when id is string", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "j1-new",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  })

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "j1-new",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job for admin", async function () {
    const resp = await request(app)
        .patch('/jobs/nope')
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth on no such job for non-admin", async function () {
    const resp = await request(app)
        .patch('/jobs/nope')
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          id: 100,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on company handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          companyHandle: "c3",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          salary: "Infinity dollars",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  // TODO: Add tests for unauth users making bad requests
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: jobIds[0] });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job for admin", async function () {
    const resp = await request(app)
        .delete('/jobs/nope')
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth for no such job for non-admin users", async function () {
    const resp = await request(app)
        .delete('/jobs/nope')
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});
