"use strict";
var fate = require('./fate')
describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(fate)
})

describe("Test collection methods", function () {
  function expectAnswer(aPromise, fulfilled, done) {
    return aPromise.then(
      function(s) { if (fulfilled) { done() } else done('Promise unexpectedly fulfilled') },
      function(s) { if (!fulfilled) { done() } else done('Promise unexpectedly rejected') }) }

  describe("on empty [] collections", function () {
    var coll = []

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("every("+coll+", false) should reject", function (done) {
      expectAnswer(fate.every(coll, false), false, done)
    })
    it("every("+coll+", true) should fulfill", function (done) {
      expectAnswer(fate.every(coll, true), true, done)
    })

    it("all("+coll+") should reject", function (done) {
      expectAnswer(fate.all(coll, undefined), false, done)
    })
    it("all("+coll+", false) should reject", function (done) {
      expectAnswer(fate.all(coll, false), false, done)
    })
    it("all("+coll+", true) should fulfill", function (done) {
      expectAnswer(fate.all(coll, true), true, done)
    })

    it("first("+coll+") should reject", function (done) {
      expectAnswer(fate.first(coll, undefined), false, done)
    })
    it("first("+coll+", false) should reject", function (done) {
      expectAnswer(fate.first(coll, false), false, done)
    })
    it("first("+coll+", true) should fulfill", function (done) {
      expectAnswer(fate.first(coll, true), true, done)
    })

    it("any("+coll+") should reject", function (done) {
      expectAnswer(fate.any(coll, undefined), false, done)
    })
    it("any("+coll+", false) should reject", function (done) {
      expectAnswer(fate.any(coll, false), false, done)
    })
    it("any("+coll+", true) should fulfill", function (done) {
      expectAnswer(fate.any(coll, true), true, done)
    })
  })

  describe("on simple [42] collections", function () {
    var coll = [42]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should fulfill", function (done) {
      expectAnswer(fate.all(coll, undefined), true, done)
    })
    it("first("+coll+") should fulfill", function (done) {
      expectAnswer(fate.first(coll, undefined), true, done)
    })
    it("any("+coll+") should fulfill", function (done) {
      expectAnswer(fate.any(coll, undefined), true, done)
    })
  })

  describe("on [<fulfilled>] collections", function () {
    var coll = [fate.fulfilled(1942)]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should fulfill", function (done) {
      expectAnswer(fate.all(coll, undefined), true, done)
    })
    it("first("+coll+") should fulfill", function (done) {
      expectAnswer(fate.first(coll, undefined), true, done)
    })
    it("any("+coll+") should fulfill", function (done) {
      expectAnswer(fate.any(coll, undefined), true, done)
    })
  })

  describe("on [<rejected>] collections", function () {
    var coll = [fate.rejected()]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should reject", function (done) {
      expectAnswer(fate.all(coll, undefined), false, done)
    })
    it("first("+coll+") should reject", function (done) {
      expectAnswer(fate.first(coll, undefined), false, done)
    })
    it("any("+coll+") should reject", function (done) {
      expectAnswer(fate.any(coll, undefined), false, done)
    })
  })

  describe("on [<rejected>, <fulfilled>] collections", function () {
    var coll = [fate.rejected(), fate.fulfilled(1942)]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should reject", function (done) {
      expectAnswer(fate.all(coll, undefined), false, done)
    })
    it("first("+coll+") should reject", function (done) {
      expectAnswer(fate.first(coll, undefined), false, done)
    })
    it("any("+coll+") should fulfill", function (done) {
      expectAnswer(fate.any(coll, undefined), true, done)
    })
  })

  describe("on [<fulfilled>, <rejected>] collections", function () {
    var coll = [fate.fulfilled(1942), fate.rejected()]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should reject", function (done) {
      expectAnswer(fate.all(coll, undefined), false, done)
    })
    it("first("+coll+") should fulfill", function (done) {
      expectAnswer(fate.first(coll, undefined), true, done)
    })
    it("any("+coll+") should fulfill", function (done) {
      expectAnswer(fate.any(coll, undefined), true, done)
    })
  })

  describe("on [<fulfilled>, <fulfilled>] collections", function () {
    var coll = [fate.fulfilled(1942), fate.fulfilled(2142)]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should fulfill", function (done) {
      expectAnswer(fate.all(coll, undefined), true, done)
    })
    it("first("+coll+") should fulfill", function (done) {
      expectAnswer(fate.first(coll, undefined), true, done)
    })
    it("any("+coll+") should fulfill", function (done) {
      expectAnswer(fate.any(coll, undefined), true, done)
    })
  })

  describe("on [<rejected>, <rejected>] collections", function () {
    var coll = [fate.rejected(), fate.rejected()]

    it("every("+coll+") should fulfill", function (done) {
      expectAnswer(fate.every(coll, undefined), true, done)
    })
    it("all("+coll+") should reject", function (done) {
      expectAnswer(fate.all(coll, undefined), false, done)
    })
    it("first("+coll+") should reject", function (done) {
      expectAnswer(fate.first(coll, undefined), false, done)
    })
    it("any("+coll+") should reject", function (done) {
      expectAnswer(fate.any(coll, undefined), false, done)
    })
  })

})
