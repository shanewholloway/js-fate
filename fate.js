/* -*- coding: utf-8 -*- vim: ts=2 sw=2 expandtab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~ Copyright (C) 2002-2012  TechGame Networks, LLC.
~
~ This library is free software; you can redistribute it
~ and/or modify it under the terms of the MIT style License as
~ found in the LICENSE file included with this distribution.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For futures and promises {then:, fulfill:, reject:} must always be fully bound closures.

Refactored for speed and reduced memory footprint. (2013-09-10)
Updated to conform to Promises/A+ Compliance Test Suite. (2013-03-11)
*/
module.exports = exports = (function(){
'use strict';

var g_nextTick = (
      (typeof process!=='undefined') ? process.nextTick
    : (typeof setImmediate!=='undefined') ? setImmediate
    : (typeof window==='undefined') ? setTimeout
    : window.setImmediate || window.setTimeout );

function bindFnFuture(promise, ftr) {
  ftr.fulfill = ftr.bind(false) // ftr.call(false, arg)
  ftr.reject = ftr.bind(true) // ftr.call(true, err)
  ftr.promise = promise
  ftr.then = promise.then
  return ftr }

function bindFnPromise(then) {
  then.then = then // make then a its own thenable/promise
  then.promise = then // then is a promise is a thenable
  return then }

var PromiseApi = {
   get promise() { return this }
  ,done: function(onFulfilled) { return this.then(onFulfilled) }
  ,fail: function(onRejected) { return this.then(null, onRejected) }
  ,always: function(onAlways) { return this.then(onAlways, onAlways) }
  ,thenCall: function(callback) { // chain to node-style callback(err, ans)
    return this.then(function(ans){ callback(null, ans) }, function(err){ callback(err) }) }
  ,timeout: function(ms, bFulfill) { return this.fate.timeout(this, ms, bFulfill) }
  //,fate: fate_module,
}

function createPromiseApi(module) {
  var api = Object.create(PromiseApi, {fate:{value:module}})

  module.Promise = Promise
  function Promise(then) { this.then = then }
  Promise.prototype = api

  function bindApiPromise(then) { return new Promise(then) }
  return bindApiPromise }

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

var exports = fate_module.call(fate_module,
      {promiseApi:true, allowSync:false})
exports.sync_api = fate_module({promiseApi:true, allowSync:true})
exports.lite_api = fate_module({promiseApi:false, allowSync:true})
return exports

function fate_module(opt) {
  var module = this
  if (module==null) module = {}
  if (opt==null) opt = {}

  var tickRev=1

  var resolvePromise = opt.allowSync ? resolvePromiseEx : resolvePromiseLater;
  function resolvePromiseLater(tip, rej, arg) {
    return resolveQueueLater([[tip, rej, arg]]), true }
  function resolvePromiseEx(tip, rej, arg, resolved) {
    var q = [[tip, rej, arg]]
    if (tickRev === tip.v)
      return resolveQueueLater(q), true
    else return resolveQueueSync(q), false }

  var bindPromise = opt.promiseApi ? createPromiseApi(module) : bindFnPromise;
  function then_tree(onFulfilled, onRejected) {
    if (this.resolved !== undefined)
      return this.resolved(onFulfilled, onRejected)

    var tip = []; tip.v = tickRev
    if (typeof onFulfilled === 'function')
      tip.onFulfilled = onFulfilled
    if (typeof onRejected === 'function')
      tip.onRejected = onRejected

    this.push(tip)
    return bindPromise(then_tree.bind(tip)) }

  function deferredEx(tip) {
    return bindFnFuture(bindPromise(then_tree.bind(tip)), function(arg) {
      if (tip.resolved!==undefined)
        return false // already resolved

      var rej = this; // this is true if called as reject(), or false if called as fulfill
      if (rej!==false && rej!==true) // then used as a callback function
        rej = arg!=null ? true : (arg=arguments[1],false);

      tip.resolved = (rej ? rejected_closure(arg) : fulfilled_closure(arg))
      resolvePromise(tip, rej, arg)
      return true } )}

  module.fulfilled_closure = fulfilled_closure
  function fulfilled_closure(arg) { var self
    function then_fulfilled(onFulfilled, onRejected) {
      if (typeof onFulfilled !== 'function')
        return self!==undefined ? self : self=bindPromise(then_fulfilled)
      var tip = []; tip.onFulfilled = onFulfilled
      // always later because then & resolve happen in same turn
      resolvePromiseLater(tip, false, arg)
      return bindPromise(then_tree.bind(tip)) }
    return then_fulfilled }

  module.rejected_closure = rejected_closure
  function rejected_closure(err) { var self
    function then_rejected(onFulfilled, onRejected) {
      if (typeof onRejected !== 'function')
        return self!==undefined ? self : self=bindPromise(then_rejected)
      var tip = []; tip.onRejected = onRejected
      // always later because then & resolve happen in same turn
      resolvePromiseLater(tip, true, err)
      return bindPromise(then_tree.bind(tip)) }
    return then_rejected }

  module.deferred = deferred
  function deferred() { return deferredEx([]) }
  module.fulfilled = fulfilled
  function fulfilled(arg) { return bindPromise(fulfilled_closure(arg)) }
  module.rejected = rejected
  function rejected(err) { return bindPromise(rejected_closure(err)) }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  var tickQueueNext=[], tickQueueActive=null

  module.tick = tick
  function tick() {
    if (tickQueueActive!==null)
      return null // no nested calls

    if (tickQueueNext.length===0)
      return tickRev++, false // nothing to do

    do {
      tickRev++ // inc tick revision

      // setup for next loop
      tickQueueActive = tickQueueNext; tickQueueNext = []

      for(var i=0; i<tickQueueActive.length; ++i)
        resolveQueueSync(tickQueueActive[i])

    } while (tickQueueNext.length!==0)
    tickQueueActive = null // free references
    return true }

  var scheduleNextTick = (opt.nextTick || g_nextTick).bind(null, tick)
  function resolveQueueLater(aQueue) {
    if (tickQueueNext.length===0 && tickQueueActive===null)
      scheduleNextTick()
    tickQueueNext.push(aQueue) }

  function resolveQueueSync(queue) {
    var after=[]

    while (queue.length!==0) {
      var tip=queue.pop(), arg=tip[2], rej=tip[1], tip=tip[0]

      var notify = rej ? tip.onRejected : tip.onFulfilled
      delete tip.v; delete tip.onRejected; delete tip.onFulfilled

      var l_rej=rej, l_arg=arg
      if (notify !== undefined)
        try { arg = notify(arg); rej = false }
        catch (err) { arg = err; rej = true }

      if (tip.length===0) continue;

      if (rej===false && arg!=null) {
        try { // test for thenable --> chained promise
          var l_then = arg.then
          if (typeof l_then === 'function') {
            var chain = deferredEx(tip.splice(0, tip.length))
            l_then.call(arg, chain.fulfill, chain.reject)
            continue }
        } catch (err) { arg = err; rej = true }
      }

      var resolved = rej ? rejected_closure(arg) : fulfilled_closure(arg)
      while (tip.length!==0) {
        var ea = tip.pop()
        ea.resolved = resolved
        ;(tickRev !== ea.v ? queue : after)
          .push([ea, rej, arg])
      }
      if (after.length!==0)
        after = resolveQueueLater(after), [];
    }
  }

  return fate_api_extensions(module) || module }


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

function fate_api_extensions(module, opt) {
  module.fate = function(opt) { return fate_module.call(this||{}, opt) }

  module.when = when
  function when(tgt, onFulfilled, onRejected) {
    var then = tgt!=null ? tgt.then : null
    if (then===null && tgt!=null && tgt.promise!=null)
      then = tgt.promise.then
    if (typeof then !== 'function')
      then = module.fulfilled(tgt).then
    return then(onFulfilled, onRejected) }

  module.inverted = inverted
  function inverted(tgt) {
    var ftr = module.deferred()
    when(tgt, ftr.reject, ftr.fulfill)
    return ftr.promise }

  module.delay = delay
  function delay(ms, bFulfill) {
    var ftr = module.deferred(),
      tid = setTimeout(bFulfill ? ftr.fulfill : ftr.reject),
      clear = clearTimeout.bind(null, tid)
    ftr.promise.then(clear, clear)
    return ftr }

  module.timeout = timeout
  function timeout(tgt, ms, bFulfill) {
    var ftr = delay(ms, bFulfill)
    return when(tgt, ftr.fulfill, ftr.reject) }


  //~ Compositions: any, all, every, first ~~~~~~~~~~~~~~~~~~~~

  function forEachPromise(anArray, step, ifEmpty) {
    var i,c=0,n=anArray.length
    if (n===0) return step(ifEmpty, 0, n)
    for(i=0; i<n; ++i) {
      var p = anArray[i]
      if (p!=null && typeof p.then === 'function')
        p.then(step_true, step_false)
      else step(true, ++c, n)
    }
    function step_true() {step(true, ++c, n)}
    function step_false() {step(false, ++c, n)}
  }

  module.every = every
  function every(anArray, ifEmpty) {
    var future=module.deferred(),
        state=ifEmpty==null || !!ifEmpty
    forEachPromise(anArray, function(ea_state, i, n) {
      state = state || ea_state
      if (i<n) return
      else if (state)
        future.fulfill({i:i,n:n})
      else future.reject({i:i,n:n})
    }, ifEmpty)
    return future.promise }

  module.all = all
  function all(anArray, ifEmpty) {
    var future=module.deferred()
    forEachPromise(anArray, function(state, i, n) {
      if (!state) future.reject({i:i,n:n})
      else if (i===n) future.fulfill({i:i,n:n})
    }, ifEmpty)
    return future.promise }

  module.first = first
  function first(anArray, ifEmpty) {
    var future=module.deferred()
    forEachPromise(anArray, function(state, i, n) {
      if (state) future.fulfill({i:i,n:n})
      else future.reject({i:i,n:n})
    }, ifEmpty)
    return future.promise }

  module.any = any
  function any(anArray, ifEmpty) {
    var future=module.deferred()
    forEachPromise(anArray, function(state, i, n) {
      if (state) future.fulfill({i:i,n:n})
      else if (i===n) future.reject({i:i,n:n})
    }, ifEmpty)
    return future.promise }

  return module }

}).call(null);
