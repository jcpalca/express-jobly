"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError, BadRequestError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");
const adminJwt = jwt.sign({ username: "admin", isAdmin: true }, SECRET_KEY);

function next(err) {
  if (err) throw new Error("Got error from middleware");
}

describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


/************************************** ensureLoggedIn */

describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next)).toThrowError();
  });
});


/************************************** ensureAdmin */

describe("ensureAdmin", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "Ezra", isAdmin: true} } };
    ensureAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { username: "Joel", isAdmin: false} } };
    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });

  test("unauth if not logged in", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureAdmin(req, res, next)).toThrow(UnauthorizedError);
  });
});

/************************************** ensureCorrectUserOrAdmin */

describe("ensureCorrectUserOrAdmin", function () {
  test("works for correct user", function () {
    const req = { params : { username: "test" }};
    const res = { locals: { user: { username : "test", isAdmin: false } } };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("works for admin", function () {
    const req = { params : { username: "test" }};
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth if not admin or correct user", function () {
    const req = { params : { username: "fake name" }};
    const res = { locals: { user: { username: "test", isAdmin: false} } };
    expect(() => ensureCorrectUserOrAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if not logged in", function () {
    const req = { params : { username: "admin" }};
    const res = {locals: {}};
    expect(() => ensureCorrectUserOrAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });
});
