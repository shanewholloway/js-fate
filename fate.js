/* -*- coding: utf-8 -*- vim: ts=2 sw=2 expandtab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~ Copyright (C) 2002-2012  TechGame Networks, LLC.
~
~ This library is free software; you can redistribute it
~ and/or modify it under the terms of the MIT style License as
~ found in the LICENSE file included with this distribution.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For futures and promises {then:, fulfill:, reject:} must always be fully bound closures.

Updated to conform to Promises/A+ Compliance Test Suite. (2013-03-11)
*/

"use strict";

exports.Promise = Promise
function Promise(then) { if (then!==undefined) this.then = then }
Promise.api = {
  always: function(always) { return this.then(always, always) },
  done: function(success) { return this.then(success, undefined) },
  fail: function(failure) { return this.then(undefined, failure) },
  thenCall: function(callback) { // chain to node-style callback(err, ans)
    return this.then(callback.bind(null,null), function(reason){callback(reason)}) },
  timeout: function(ms) { return Promise.timeout(this, ms) },
  thenLog: function(opt) { return thenLog(this, opt) }
}
Promise.prototype = Object.create(Promise.api,
  {promise: {get: function(){return this}}
  ,state: {enumerable: true, get: function(){return this.then.state}}
  })

exports.isPromise = Promise.isPromise = isPromise
function isPromise(tgt, orHasPromise) {
  return (tgt!=null) && tgt.promise!=null && tgt.promise.then!=null }

exports.asPromise = Promise.wrap = asPromise
function asPromise(tgt) {
  if (tgt==null || tgt.promise==null)
      tgt = Future.resolved(tgt)
  return tgt.promise }

exports.when = Promise.when = when
function when(tgt, success, failure) {
  if (success!==undefined || failure!==undefined)
    return Promise.wrap(tgt).then(success, failure)
  else return Promise.wrap(tgt) }

var slice = Array.prototype.slice

exports.Future = Future
function Future(then, fulfill, reject) {
  this.promise = new Promise(then)
  if (fulfill!==undefined)
    this.fulfill = fulfill
  if (reject!==undefined)
    this.reject = reject
}
Future.prototype = Object.create(Promise.api,
  {then: {get: function(){return this.promise.then}}
  ,state: {get: function(){return this.promise.state}}
  ,resolve: {get: function(){return this.fulfill}}
  ,callback: {get: function(){ var self=this; // lazy-bind node-style callback
    return function(err, value){ return err!=null ? self.reject(err) : self.fulfill(value) }}}
  })
Future.prototype.fulfill = function(value) { }
Future.prototype.reject = function(reason) { }
Future.nextTick = (function(){
  if (typeof process !== 'undefined' && process.nextTick)
    return process.nextTick
  if (typeof setImmediate !== 'undefined')
    return setImmediate
  if (typeof setTimeout !== 'undefined')
    return setTimeout
  return window.setImmediate || window.setTimeout; })()

//~ Future: deferred, resolved and rejected ~~~~~~~

exports.deferredThen = Future.deferredThen = deferredThen
function deferredThen(onFulfilled, onRejected) {
  if (onFulfilled != null && typeof onFulfilled !== 'function' && onRejected == null) {
    onRejected = onFulfilled.reject; onFulfilled = onFulfilled.fulfill; }

  var ftr=Future.deferred(),
      self=Object.create(ftr);

  if (typeof onFulfilled === 'function')
    self.fulfill = function (value) {
      try { var ans = onFulfilled(value)
      } catch (err) { return ftr.reject(err) }
      if (ans==null || typeof ans.then !=='function')
        return ftr.fulfill(ans)
      ans.then(ftr.fulfill, ftr.reject) }

  if (typeof onRejected === 'function')
    self.reject = function (reason) {
      try { var ans = onRejected(reason)
      } catch (err) { return ftr.reject(err) }
      if (ans==null || typeof ans.then !=='function')
        return ftr.fulfill(ans)
      ans.then(ftr.fulfill, ftr.reject) }

  return self; }

exports.pending = deferred
exports.deferred = Future.deferred = deferred
function deferred() {
  var actions=[], answerFn;

  function then_deferred(onFulfilled, onRejected) {
    var ftr = deferredThen(onFulfilled, onRejected)
    actions.push(ftr)
    if (answerFn!==undefined && 1===actions.length)
      Future.nextTick(answerFn)
    return ftr.promise }
  function fulfill_deferred(value) {
    if (answerFn !== undefined) return;
    then_deferred.state = true
    answerFn = answer.bind(null, function (ftr) {
      try { ftr.fulfill(value) } catch (err) {} })
    return answerFn() }
  function reject_deferred(reason) {
    if (answerFn !== undefined) return;
    then_deferred.state = false
    answerFn = answer.bind(null, function (ftr) {
      try { ftr.reject(reason) } catch (err) {} })
    return answerFn() }
  function answer(answerFn) {
    actions.splice(0).forEach(answerFn) }

  return new Future(then_deferred, fulfill_deferred, reject_deferred) }

exports.resolved = Future.resolved = fulfilled
exports.fulfilled = Future.fulfilled = fulfilled
function fulfilled(value) {
  var ftr = deferred();
  ftr.fulfill(value);
  return ftr.promise }

exports.rejected = Future.rejected = rejected
function rejected(reason) {
  var ftr = deferred();
  ftr.reject(reason);
  return ftr.promise }


//~ Utility Futures: invert, delay and timeout ~~~~~~~~~~~~~~
exports.inverted = Future.inverted = inverted
function inverted(tgt) {
  if (tgt===undefined) tgt = deferred()
  return new Future(tgt.promise.then, tgt.reject, tgt.fulfill) }

exports.delay = Future.delay = Promise.delay = delay
function delay(ms, bReject) {
  var res=deferred(),
      tid=setTimeout(bReject?res.reject:res.fulfill, ms)
  res.always(function() {clearTimeout(tid)})
  return res }
exports.timeout = Future.timeout = Promise.timeout = timeout
function timeout(tgt, ms, bReject) {
  bReject = bReject===undefined ? true : !!bReject;
  var res = delay(ms, bReject)
  when(tgt, res.resolve, res.reject)
  return res }

exports.thenLog = thenLog
function thenLog(tgt, opt) {
  if (!opt) opt = {}
  var log = opt.log || console.log,
      m = opt.msg ? opt.msg+' ' : '',
      s = opt.success || 'success',
      f = opt.failure || 'failure'

  if (!opt.showArgs && opt.showArgs!==undefined)
    tgt.promise.then(function(){log(s)}, function(){log(f)})
  else tgt.promise.then(
    function(){log(m+s+': ', slice.call(arguments, 0).join(', '))},
    function(){log(m+f+': ', slice.call(arguments, 0).join(', '))})
  return tgt /* don't chain for logging */ }

//~ Compositions: any, all, every, first ~~~~~~~~~~~~~~~~~~~~
function forEachPromise(anArray, step) {
  var i,c=0,n=anArray.length
  for(i=0; i<n; ++i)
    if (!isPromise(anArray[i]))
      step(true, ++c, n)
    else anArray[i].promise.then(
      function() {step(true, ++c, n)},
      function() {step(false, ++c, n)})
  if (n<=0) step(undefined, true, 0, n) }

exports.every = Future.every = Promise.every = every
function every(anArray) {
  var future=Future.deferred(), state=true
  forEachPromise(anArray, function(ea_state, i, n) {
    state = state || ea_state
    if (i<n) return
    else if (state)
      future.fulfill({i:i,n:n})
    else future.reject({i:i,n:n}) })
  return future.promise }

exports.all = Future.all = Promise.all = all
function all(anArray) {
  var future=Future.deferred()
  forEachPromise(anArray, function(state, i, n) {
    if (!state) future.reject({i:i,n:n})
    else if (i>=n) future.fulfill({i:i,n:n}) })
  return future.promise }

exports.first = Future.first = Promise.first = first
function first(anArray) {
  var future=Future.deferred()
  forEachPromise(anArray, function(state, i, n) {
    if (state) future.fulfill({i:i,n:n})
    else future.reject({i:i,n:n}) })
  return future.promise }

exports.any = Future.any = Promise.any = any
function any(anArray) {
  var future=Future.deferred()
  forEachPromise(anArray, function(state, i, n) {
    if (state) future.fulfill({i:i,n:n})
    else if (i>=n) future.reject({i:i,n:n}) })
  return future.promise }

