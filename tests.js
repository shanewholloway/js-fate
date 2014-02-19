#!node_modules/.bin/mocha
"use strict";
var fate = require('./fate'), msTestDelay=2

describe("Promises/A+ Tests", function () {
  fate.pending = fate.deferred
  require("promises-aplus-tests").mocha(fate)
})


function expectAnswer(aPromise, fulfilled, done) {
return aPromise.then(
    function(s) { if (fulfilled) { done() } else done('Promise unexpectedly fulfilled') },
    function(s) { if (!fulfilled) { done() } else done('Promise unexpectedly rejected') }) }

describe("Test collection methods", function () {

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

describe("Test delay method", function () {
  it("rejected delay("+msTestDelay+") should reject", function(done) {
    var f = fate.delay(msTestDelay)
    expectAnswer(f, false, done)
    f.reject()
  })
  it("rejected delay("+msTestDelay+", false) should reject", function(done) {
    var f = fate.delay(msTestDelay, false)
    expectAnswer(f, false, done)
    f.reject()
  })
  it("rejected delay("+msTestDelay+", true) should reject", function(done) {
    var f = fate.delay(msTestDelay, true)
    expectAnswer(f, false, done)
    f.reject()
  })

  it("fulfilled delay("+msTestDelay+") should fulfill", function(done) {
    var f = fate.delay(msTestDelay)
    expectAnswer(f, true, done)
    f.fulfill()
  })
  it("fulfilled delay("+msTestDelay+", false) should fulfill", function(done) {
    var f = fate.delay(msTestDelay, false)
    expectAnswer(f, true, done)
    f.fulfill()
  })
  it("fulfilled delay("+msTestDelay+", true) should fulfill", function(done) {
    var f = fate.delay(msTestDelay, true)
    expectAnswer(f, true, done)
    f.fulfill()
  })

  it("unresolved delay("+msTestDelay+") should reject", function(done) {
    var f = fate.delay(msTestDelay)
    expectAnswer(f, false, done)
  })
  it("unresolved delay("+msTestDelay+", false) should reject", function(done) {
    var f = fate.delay(msTestDelay, false)
    expectAnswer(f, false, done)
  })
  it("unresolved delay("+msTestDelay+", true) should fulfill", function(done) {
    var f = fate.delay(msTestDelay, true)
    expectAnswer(f, true, done)
  })
})

describe("Test timeout method", function () {
  it("rejected timeout("+msTestDelay+") should reject", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay), false, done)
    f.reject()
  })
  it("rejected timeout("+msTestDelay+", false) should reject", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, false), false, done)
    f.reject()
  })
  it("rejected timeout("+msTestDelay+", true) should reject", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, true), false, done)
    f.reject()
  })

  it("fulfilled timeout("+msTestDelay+") should fulfill", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay), true, done)
    f.fulfill()
  })
  it("fulfilled timeout("+msTestDelay+", false) should fulfill", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, false), true, done)
    f.fulfill()
  })
  it("fulfilled timeout("+msTestDelay+", true) should fulfill", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, true), true, done)
    f.fulfill()
  })

  it("unresolved timeout("+msTestDelay+") should reject", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay), false, done)
  })
  it("unresolved timeout("+msTestDelay+", false) should reject", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, false), false, done)
  })
  it("unresolved timeout("+msTestDelay+", true) should fulfill", function(done) {
    var f = fate.deferred()
    expectAnswer(f.promise.timeout(msTestDelay, true), true, done)
  })
})
