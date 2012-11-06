Fate is a small implementation of CommonJS Promises/A

## Promises and Futures
A `Promise` is an object with a `then(success, failure)` closure.

A `Future` is a `Promise` that with `resolve(result)` and `reject(error)` closures.

`thenable(thisArg, success, failure)` returns an unresolved `Future` instance bound to `success` and
`failure` callbacks. `thenable()` is used to implement the semantics of other futures.

`deferred(thisArg)` returns an unresolved `Future` instance.
`resolved(result, thisArg)` returns a resolved `Future` instance.
`rejected(error, thisArg)` returns a rejected `Future` instance.
`inverted(aFuture)` returns a `Future` instance with `reject()` and `resolve()` transposed.

`delay(ms)` returns a `deferred()` that will be answered after `ms` timeout.
`timeout(target, ms)` returns a `delay(ms)` that will additionally be answered upon `target` being answered.

## Compound Promises
`each(anArray, thisArg)` is a compound `deferred()` answered after
all promises in `anArray` are either rejected or resolved.
Resolved if *all* promise are resolved from `anArray`..
Rejected if *any* promises is rejected from `anArray`.

`all(anArray, thisArg)` is a compound `deferred()` answered after
all promises are resolved, or when any promise is rejected.
Resolved if *any* promise is resolved from `anArray`.
Rejected if *all* promises are rejected from `anArray`.

`first(anArray, thisArg)` is a compound `deferred()` answered after
any promise is either resolved or rejected.
Resolved if *any* promise is resolved from `anArray`.
Rejected if *all* promises are rejected from `anArray`.

`any(anArray, thisArg)` is a compound `deferred()` answered after
any promise is resolved, or when all are rejected.
Resolved if *any* promise is resolved from `anArray`.
Rejected if *all* promises are rejected from `anArray`.

