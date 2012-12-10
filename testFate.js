"use strict";

function say(msg, ans) {
    if (ans===undefined)
        return console.log('    ', msg)
    else return console.log('    ', msg, ans)}
function fail(msg, ans) {
    var err = new Error('ErrorObj::'+msg);
    console.log('    ', "RAISING ERROR", err, ans);
    throw err; }

var fate = require('./fate.js'), p = fate;

function testFuture(aVar) {
    var n,p
    n = aVar.then(function(a){say('resolve 1',a)}, function(a){say('REJECT 1',a)})
    n = n.then(function(a){say('resolve 2',a)}, function(a){say('REJECT 2',a)})
    p = n
    p.then(function(a){say('pre resolve 3',a)}, function(a){say('pre REJECT 3',a)})
    n = n.then(function(a){fail('resolve 3',a)}, function(a){fail('REJECT 3',a)})
    p.then(function(a){say('parallel resolve 3',a)}, function(a){say('parallel REJECT 3',a)})

    n.then(function(a){say('resolve 4',a)}, function(a){say('REJECT 4',a)})
    n.then(function(a){say('parallel resolve 4',a)}, function(a){say('parallel REJECT 4',a)})

    return aVar;
}

if (1) {
    console.log("\nResolved:");
    testFuture(p.resolved({state: "awesome"}))
    console.log("\n  post Resolved:");
}

if (1) {
    console.log("\nRejected:");
    testFuture(p.rejected({state: "dejected"}))
    console.log("\n  post Rejected:");
}

if (1) {
    console.log("\nDeferred Resolved:");
    var d = testFuture(p.deferred());

    console.log("\n  resolving deferred:");
    d.resolve({state: "passed"});

    console.log("\n  post resolving deferred:");
}

if (1) {
    console.log("\nDeferred Rejected:");
    var d = testFuture(p.deferred());

    console.log("\n  rejecting deferred:");
    d.reject({state: "failed"});

    console.log("\n  post rejecting deferred:");
}

if (1) {
    console.log("\nInverted Resolved:");
    var d = testFuture(p.inverted());

    console.log("\n  resolving deferred:");
    d.resolve({state: "invert +++"});

    console.log("\n  post resolving deferred:");
}

if (1) {
    console.log("\nInverted Rejected:");
    var d = testFuture(p.inverted());

    console.log("\n  rejecting deferred:");
    d.reject({state: "invert ---"});

    console.log("\n  post rejecting deferred:");
}


function futureArray(n) {
    var res = new Array(n||3);
    for (var i=0; i<res.length; i++) {
        res[i] = p.deferred(this);
        res[i].idx = i;
    }
    return res;
}

if (1) {
    var fa = futureArray(3)
    console.log("\nResolve All:");

    console.log('  PRE all')
    p.all(fa).then(
        function(a){say('all resolve')},
        function(a){say('all reject')})
    console.log('  POST all\n')

    fa[0].resolve(1942)
    console.log('    POST 1942')
    fa[1].resolve(2042)
    console.log('    POST 2042')
    fa[2].resolve(1911)
    console.log('    POST 1911')

    console.log("\n  post Resolve All:");
}

if (1) {
    var fa = futureArray(3)
    console.log("\nResolve Every:");

    console.log('  PRE every')
    p.every(fa).then({
        resolve: function(a){say('every resolve')},
        reject: function(a){say('every reject')}})
    console.log('  POST every\n')

    fa[0].resolve(1942)
    console.log('    POST 1942')
    fa[1].reject(2042)
    console.log('    POST 2042')
    fa[2].resolve(1911)
    console.log('    POST 1911')

    console.log("\n  post Resolve Every:");
}
if (1) {
    var fa = futureArray(3)
    console.log("\nResolve Any:");

    console.log('  PRE any')
    p.any(fa).then(
        function(a){say('any resolve')},
        function(a){say('any reject')})
    console.log('  POST any\n')

    fa[0].reject(1942)
    console.log('    POST 1942')
    fa[1].resolve(2042)
    console.log('    POST 2042')
    fa[2].reject(1911)
    console.log('    POST 1911')

    console.log("\n  post Resolve Any:");
}

if (1) {
    var fa = futureArray(3)
    console.log("\nResolve First:");

    console.log('  PRE first')
    p.first(fa).then({
        resolve: function(a){say('first resolve')},
        reject: function(a){say('first reject')}})
    console.log('  POST first\n')

    fa[0].reject(1942)
    console.log('    POST 1942')
    fa[1].resolve(2042)
    console.log('    POST 2042')
    fa[2].reject(1911)
    console.log('    POST 1911')

    console.log("\n  post Resolve First:");
}

if (0) {
    var f0=p.deferred(), f1=p.deferred();
    f0.timeout(200).then(
        function(){ say('success f0') },
        function(){ say('fail f0') })
    setTimeout(function() {f0.resolve(1942)}, 50)

    f1.timeout(200).then(
        function(){ say('fail f1') },
        function(){ say('success f1') })
}

if (1) {
    var d_err, d_ans

    d_err = fate.deferred()
    d_err.thenCall(function(err, ans) {
        if (err) console.log('successfully received err', err)
        else console.log('FAIL did not receive err')
    })
    d_err.reject(new Error('A successful error'))

    d_ans = fate.deferred()
    d_ans.thenCall(function(err, ans) {
        console.log("resolve:", [].concat(arguments))
        if (err) console.log('FAIL received unexpected err')
        if (ans) console.log('successfully received ans', ans)
        else console.log('FAIL received invalid ans', ans)
    })
    d_ans.resolve(1942)
}

if (1) {
    var fs = require('fs'), d_err, d_ans;

    d_ans = fate.deferred()
    d_ans.done(function(ans) { console.log('success', !!ans) })
         .fail(function(err) { console.log('FAIL', err) })

    d_err = fate.deferred()
    d_err.done(function(ans) { console.log('FAIL', !!ans) })
         .fail(function(err) { console.log('success', !!err) })

    fs.stat('./fate.js', d_ans.callback)
    fs.stat('./-does-not-exist-.dne', d_err.callback)
}
