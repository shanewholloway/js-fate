[![Promises/A+ 1.0 compliant][A+logo]][A+]

Fate is a closure based implementation of [Promises/A+][A+]

 [A+]: http://promises-aplus.github.com/promises-spec
 [A+logo]: http://promises-aplus.github.com/promises-spec/assets/logo-small.png


## Promises and Futures
A `Promise` is an object with a `then(onFulfilled, onRejected)` closure.

A `Future` is a `Promise` with bound `fulfill(value)` and `reject(reason)` closures.

`deferred()` returns an unresolved `Future` instance.

`fulfilled(result)` returns a fulfilled `Future` instance.

`rejected(error)` returns a rejected `Future` instance.

---
`inverted(aFuture)` returns a `Future` instance with `reject()` and `fulfill()` transposed.

---
`delay(ms)` returns a `deferred()` that will be answered after `ms` timeout.

`timeout(target, ms)` returns a `delay(ms)` that will additionally be answered upon `target` being answered.


## Compound Promises
`each(anArray)` is a compound `deferred()` answered after
all promises in `anArray` are either rejected or fulfilled.

Fulfilled if *all* promise are fulfilled from `anArray`.

Rejected if *any* promises is rejected from `anArray`.

---
`all(anArray)` is a compound `deferred()` answered after
all promises are fulfilled, or when any promise is rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.

---
`first(anArray)` is a compound `deferred()` answered after
any promise is either fulfilled or rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.

---
`any(anArray)` is a compound `deferred()` answered after
any promise is fulfilled, or when all are rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.

