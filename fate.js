/* -*- coding: utf-8 -*- vim: set ts=2 sw=2 expandtab
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
    timeout: function(ms) { return Promise.timeout(this, ms) } }
Promise.prototype = Object.create(Promise.api,
    {promise: {get: function(){return this}}
    ,state: {get: function(){return this.then.state}}
    })

exports.isPromise = Promise.isPromise = isPromise
function isPromise(tgt) {
    return (tgt!==undefined) && (tgt.then!==undefined) }

exports.asPromise = Promise.wrap = asPromise
function asPromise(tgt) {
    return isPromise(tgt) ? tgt : Future.resolved(tgt).promise }

exports.when = Promise.when = when
function when(tgt, success, failure) {
    if (success!==undefined || failure!==undefined)
        return asPromise(tgt).then(success, failure)
    else return asPromise(tgt) }

exports.Future = Future
function Future(then, resolve, reject) {
    this.promise = new Promise(then)
    if (resolve !== undefined)
        this.resolve = resolve
    if (reject !== undefined)
        this.reject = reject
}
Future.prototype = Object.create(Promise.api,
    {then: {get: function(){return this.promise.then}}
    ,state: {get: function(){return this.promise.state}}
    ,callback: {get: function(){ var self=this; // lazy-bind node-style callback
      return function(err,ans){ return err ? self.reject(err) : self.resolve(ans) }}}
    })
Future.prototype.resolve = function(result) { }
Future.prototype.reject = function(error) { }

exports.isFuture = Future.isFuture = isFuture
function isFuture(tgt) {
    return (tgt!==undefined) &&
         ( (typeof tgt.resolve==='function')
        || (typeof tgt.reject ==='function')) }


//~ Future: thenable, deferred, resolved and rejected ~~~~~~~
exports.thenable = Future.thenable = thenable
function thenable(thisArg, success, failure, inner) {
    if (typeof success === "object") {
        if (failure===undefined)
            failure = success.failure || success.reject || success.fail
        success = success.success || success.resolve || success.done
    }
    if (success===undefined && failure===undefined)
        return Future.deferred(thisArg)
    else return new Future(then, resolve, reject)

    function then(success, failure) {
        if (inner===undefined)
            inner = Future.deferred(thisArg)
        return inner.then(success, failure) }
    function resolve(result) {
        then.state = true
        var next = (inner!==undefined) ? inner : Future.absentTail
        if (success!==undefined)
            try {
                var res = success.call(thisArg, result)
                if (res!==undefined) result = res
            } catch (err) {
                success = failure = undefined
                inner = Future.rejected(err)
                return next.reject(err)
            }
        else if (failure===undefined) return
        success = failure = undefined
        inner = Future.resolved(result)
        return next.resolve(result) }
    function reject(error) {
        then.state = false
        var next = (inner!==undefined) ? inner : Future.absentTail
        if (failure!==undefined)
            try {
                var res = failure.call(thisArg, error)
                if (res!==undefined) error = res
            } catch (err) { error = err }
        else if (success===undefined) return;
        success = failure = undefined
        inner = Future.rejected(error)
        return next.reject(error) } }

Future.absentTail = {resolve: function(result) {}, reject: function(error) {}}
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
    function resolve(result) {
        then.state = true
        if (actions===undefined) return;
        inner = Future.resolved(result, thisArg)
        for (var i=0; i<actions.length; i++) {
            var ea = actions[i].resolve
            if (ea===undefined) continue
            try { ea.call(thisArg, result)
            } catch (err) { Future.onActionError(err, thisArg) }
        } actions = undefined }
    function reject(error) {
        then.state = false
        if (actions===undefined) return
        inner = Future.rejected(error, thisArg)
        for (var i=0; i<actions.length; i++) {
            var ea = actions[i].reject
            if (ea===undefined) continue
            try { ea.call(thisArg, error)
            } catch (err) { Future.onActionError(err, thisArg) }
        } actions = undefined }
}

exports.resolved = Future.resolved = resolved
function resolved(result, thisArg) {
    then.state = true
    return new Future(then)
    function then(success, failure) {
        var ans = thenable(thisArg, success, failure)
        return ans.resolve(result), ans.promise }}

exports.rejected = Future.rejected = rejected
function rejected(error, thisArg) {
    then.state = false
    return new Future(then)
    function then(success, failure) {
        var ans = thenable(thisArg, success, failure)
        return ans.reject(error), ans.promise }}


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


//~ Compositions: any, all, every, first ~~~~~~~~~~~~~~~~~~~~
function forEachPromise(anArray, thisArg, resolveFirst, rejectFirst, rejectAll) {
    var n=0, future=deferred(thisArg), linchpin={
        push: function(ea) {
            if (isPromise(ea)) {
                ++n; ea.then(linchpin)
            } else if (resolveFirst)
                future.resolve(anArray)
            return ea },
        resolve: function() {
            if (resolveFirst || (--n < 1))
                future.resolve(anArray) },
        reject: function() {
            if (rejectFirst || (--n < 1))
                future.reject(anArray)
            if (rejectAll)
                future.resolve = future.reject } }

    ;[].forEach.call(anArray, linchpin.push)
    if (n<1) future.resolve(n)
    return future }

exports.every = Future.every = Promise.every = every
function every(anArray, thisArg) {
    return forEachPromise(anArray, thisArg, false, false, true) }
exports.all = Future.all = Promise.all = all
function all(anArray, thisArg) {
    return forEachPromise(anArray, thisArg, false, true) }
exports.first = Future.first = Promise.first = first
function first(anArray, thisArg) {
    return forEachPromise(anArray, thisArg, true, true) }
exports.any = Future.any = Promise.any = any
function any(anArray, thisArg) {
    return forEachPromise(anArray, thisArg, true, false) }

