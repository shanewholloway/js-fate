/* -*- coding: utf-8 -*- vim: ts=2 sw=2 expandtab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~ Copyright (C) 2002-2012  TechGame Networks, LLC.
~
~ This library is free software; you can redistribute it
~ and/or modify it under the terms of the MIT style License as
~ found in the LICENSE file included with this distribution.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For futures and promises {then:, resolve:, reject:} must always be fully bound closures.
*/

"use strict";

exports.Promise = Promise
function Promise(then) { if (then!==undefined) this.then = then }
Promise.api = {
  always: function(always) { return this.then(always, always) },
  done: function(success) { return this.then(success, undefined) },
  fail: function(failure) { return this.then(undefined, failure) },
  thenCall: function(callback) { // chain to node-style callback(err, ans)
    return this.then(callback.bind(this,null), callback.bind(this)) },
  timeout: function(ms) { return Promise.timeout(this, ms) },
  thenLog: function(opt) { return thenLog(this, opt) }
}
Promise.prototype = Object.create(Promise.api,
  {promise: {get: function(){return this}}
  ,state: {get: function(){return this.then.state}}
  })

exports.isPromise = Promise.isPromise = isPromise
function isPromise(tgt) {
  return (tgt!=null) && (tgt.then!=null) }

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
function Future(then, resolve, reject) {
  this.promise = new Promise(then)
  if (resolve!==undefined)
    this.resolve = resolve
  if (reject!==undefined)
    this.reject = reject
}
Future.prototype = Object.create(Promise.api,
  {then: {get: function(){return this.promise.then}}
  ,state: {get: function(){return this.promise.state}}
  ,callback: {get: function(){ var self=this; // lazy-bind node-style callback
    return function(err, ans){
      return err ? self.reject(err)
        : self.resolve.apply(self, slice.call(arguments, 1)); }}}
  })
Future.prototype.resolve = function(result) { }
Future.prototype.reject = function(error) { }

exports.isFuture = Future.isFuture = isFuture
function isFuture(tgt) {
  if (tgt===undefined) return false;
  return (typeof tgt.resolve==='function') || (typeof tgt.reject==='function') }

//~ Future: thenable, deferred, resolved and rejected ~~~~~~~
exports.thenable = Future.thenable = thenable
thenable.unpack = function(obj, failure) { return {
  success: obj.success || obj.resolve,
  failure: failure || obj.failure || obj.reject} }
function thenable(thisArg, success, failure, inner) {
  if (typeof success==="object") {
    var obj = thenable.unpack(obj=success, failure)
    failure = obj.failure; success = obj.success
  }
  if (success===undefined && failure===undefined)
    return Future.deferred(thisArg)
  else return new Future(then, resolve, reject)

  function argsAsArray(args) {
    return args instanceof Array ? args : [args] }
  function then(success, failure) {
    if (inner===undefined)
      inner = Future.deferred(thisArg)
    return inner.then(success, failure) }
  function resolve() {
    then.state = true
    var resultVec = arguments,
        tail = (inner!==undefined) ? inner : Future.absentTail
    if (success!==undefined)
      try {
        var res = success.apply(thisArg, resultVec)
        if (res!==undefined)
          resultVec = argsAsArray(res)
      } catch (err) {
        success = failure = undefined
        inner = Future.rejected(err, thisArg)
        return tail.reject(err)
      }
    success = failure = undefined
    inner = Future.resolved(resultVec, thisArg, true)
    return tail.resolve.apply(tail, resultVec) }
  function reject() {
    then.state = false
    var errorVec = arguments,
        tail = (inner!==undefined) ? inner : Future.absentTail
    if (failure!==undefined)
      try {
        var res = failure.apply(thisArg, errorVec)
        if (res!==undefined)
          errorVec = argsAsArray(res)
      } catch (err) { errorVec = [err] }
    success = failure = undefined
    inner = Future.rejected(errorVec, thisArg, true)
    return tail.reject.apply(tail, errorVec) } }

Future.absentTail = {resolve: function() {}, reject: function() {}}
Future.onActionError = function(error, thisArg) { console.error(error) }

exports.deferred = Future.deferred = deferred
function deferred(thisArg) {
  var actions=[], inner
  return new Future(then, resolve, reject)
  function then(success, failure) {
    if (inner!==undefined)
      return inner.then(success, failure)
    var ans = Future.thenable(thisArg, success, failure)
    actions.push(ans)
    return ans.promise }
  function resolve() {
    then.state = true
    if (actions===undefined) return;
    var resultVec = arguments
    inner = Future.resolved(resultVec, thisArg, true)
    for (var i=0; i<actions.length; i++) {
      var ea = actions[i].resolve
      if (ea===undefined) continue
      try { ea.apply(thisArg, resultVec)
      } catch (err) { Future.onActionError(err, thisArg) }
    } actions = undefined }
  function reject() {
    then.state = false
    if (actions===undefined) return
    var errorVec = arguments
    inner = Future.rejected(errorVec, thisArg, true)
    for (var i=0; i<actions.length; i++) {
      var ea = actions[i].reject
      if (ea===undefined) continue
      try { ea.apply(thisArg, errorVec)
      } catch (err) { Future.onActionError(err, thisArg) }
    } actions = undefined }
}

exports.resolved = Future.resolved = resolved
function resolved(result, thisArg, inVecForm) {
  if (!inVecForm) result = [result]
  else result = slice.call(result, 0)
  then.state = true
  return new Future(then)
  function then(success, failure) {
    var ans = thenable(thisArg, success, failure)
    return ans.resolve.apply(ans, result), ans.promise }}

exports.rejected = Future.rejected = rejected
function rejected(error, thisArg, inVecForm) {
  if (!inVecForm) error = [error]
  else error = slice.call(error, 0)
  then.state = false
  return new Future(then)
  function then(success, failure) {
    var ans = thenable(thisArg, success, failure)
    return ans.reject.apply(ans, error), ans.promise }}


//~ Utility Futures: invert, delay and timeout ~~~~~~~~~~~~~~
exports.inverted = Future.inverted = inverted
function inverted(tgt) {
  if (tgt===undefined) tgt = deferred()
  return new Future(tgt.then, tgt.reject, tgt.resolve) }

exports.delay = Future.delay = Promise.delay = delay
function delay(ms, bReject) {
  var res=deferred(),
      tid=setTimeout(bReject?res.reject:res.resolve, ms)
  res.always(function() {clearTimeout(tid)})
  return res }
exports.timeout = Future.timeout = Promise.timeout = timeout
function timeout(target, ms, bReject) {
  var res = delay(ms, (bReject!=undefined?bReject:true))
  when(target, res)
  return res }

exports.thenLog = thenLog
function thenLog(target, opt) {
  if (!opt) opt = {}
  var log = opt.log || console.log,
      s = opt.success || 'success',
      f = opt.failure || 'failure'

  if (!opt.showArgs && opt.showArgs!==undefined)
    target.then(function(){log(s)}, function(){log(f)})
  else target.then(
    function(){log(s+': ', slice.call(arguments, 0).join(', '))},
    function(){log(f+': ', slice.call(arguments, 0).join(', '))})
  return target /* don't chain for logging */ }

//~ Compositions: any, all, every, first ~~~~~~~~~~~~~~~~~~~~
function forEachPromise(anArray, step) {
  var i,c=0,n=anArray.length
  for(i=0; i<n; ++i)
    if (!isPromise(anArray[i]))
      step(true, ++c, n)
    else anArray[i].then(
      function() {step(true, ++c, n)},
      function() {step(false, ++c, n)})
  if (n<=0) step(undefined, true, 0, n) }

exports.every = Future.every = Promise.every = every
function every(anArray, thisArg) {
  var future=Future.deferred(thisArg), state=true
  forEachPromise(anArray, function(ea_state, i, n) {
    state = state || ea_state
    if (i<n) return
    else if (state)
      future.resolve({i:i,n:n})
    else future.reject({i:i,n:n}) })
  return future.promise }

exports.all = Future.all = Promise.all = all
function all(anArray, thisArg) {
  var future=Future.deferred(thisArg)
  forEachPromise(anArray, function(state, i, n) {
    if (!state) future.reject({i:i,n:n})
    else if (i>=n) future.resolve({i:i,n:n}) })
  return future.promise }

exports.first = Future.first = Promise.first = first
function first(anArray, thisArg) {
  var future=Future.deferred(thisArg)
  forEachPromise(anArray, function(state, i, n) {
    if (state) future.resolve({i:i,n:n})
    else future.reject({i:i,n:n}) })
  return future.promise }

exports.any = Future.any = Promise.any = any
function any(anArray, thisArg) {
  var future=Future.deferred(thisArg)
  forEachPromise(anArray, function(state, i, n) {
    if (state) future.resolve({i:i,n:n})
    else if (i>=n) future.reject({i:i,n:n}) })
  return future.promise }

