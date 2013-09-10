[![Promises/A+ 1.0 compliant][A+logo]][A+]

Fate is a closure based implementation of [Promises/A+][A+]

 [A+]: http://promises-aplus.github.com/promises-spec
 [A+logo]: http://promises-aplus.github.com/promises-spec/assets/logo-small.png


## Promises and Futures
A `promise` is an object with a `then(onFulfilled, onRejected)` closure, making a promise a `thenable` object.

A `future` is a `thenable` with bound `fulfill(value)` and `reject(reason)` closures. In fate, a future is also a valid node style `function(err,arg)` callback.

`fate.deferred()` returns an unresolved (pending) `future`.

`fate.fulfilled(value)` returns a fulfilled `promise`.

`fate.rejected(reason)` returns a rejected `promise`.


### Utilities

`inverted(aFuture)` returns a `promise` that transposes `onFulfilled` and `onRejected`.

`delay(ms, bFulfill=false)` returns a `deferred()` that will be answered after `ms` timeout.

`timeout(target, ms)` returns a `delay(ms)` that will additionally be answered upon `target` being answered.


### Composed `each`
`each(anArray)` is a compound `deferred()` answered after
all promises in `anArray` are either rejected or fulfilled.

Fulfilled if *all* promise are fulfilled from `anArray`.

Rejected if *any* promises is rejected from `anArray`.


### Composed `all`
`all(anArray)` is a compound `deferred()` answered after
all promises are fulfilled, or when any promise is rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.


### Composed `first`
`first(anArray)` is a compound `deferred()` answered after
any promise is either fulfilled or rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.


### Composed `any`
`any(anArray)` is a compound `deferred()` answered after
any promise is fulfilled, or when all are rejected.

Fulfilled if *any* promise is fulfilled from `anArray`.

Rejected if *all* promises are rejected from `anArray`.

