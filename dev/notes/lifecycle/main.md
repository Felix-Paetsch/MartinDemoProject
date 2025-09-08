# Cleanup - especially on errors - is really important.

## The following things have to be cleaned up correctly:

-   Libraries when not used anymore
-   Shared state between plugins
-   Plugin references on Plugin Removal
-   Unresponsive endpoints
-   Plugin Finalizers
-   (Not) responded to chain messages
-   User defined things
-   ...

## A cleanUp consists of 3 things:

-   registering
-   triggering
-   executing

if we can log and match these, we can verify that cleanUps happen correctly. This is possible on the server (writing to a file,) but not immediately clear in the browser [as there is no shared ground, note that the messaging system is part of the cleanup problem].

=> Solution [for the Kernel]:

There is a class one can log these different events with.
They are immediately exfiltrated to the outside world (most likely via http)
and can then be evaluated.

```ts
globalThis.sth.instanciate(uuid); // Includes stack and meta data
// Maybe extra info and a "type"
globalThis.sth.disposed(uuid);
globalThis.sth.partial_dispose(uuid); // When there are several things
globalThis.sth.trigger_dispose(uuid);
```

Instanciate and dispose are easily matched in most cases, with the same uuid.
For trigger dispose note, that the uuid currently has to be known.
However we can also allow weak matches (e.g. regex?) on instanciate/disposed/trigger_disposed to allow for less fine-grained matches.

Alternatively we can in most cases derive a uuid from from data we need anyway to keep the reference.
In the outside world we can run test-cases over these matches. In particular also describing other things via this external API might be useful for testing.

In general this
a) Might be nice for testing
b) Be nice for

## Problems with cleanup:

-   What happens on error?
-   How to make it fast?
-   What if cleanUps want to make callbacks to the object cleaned up (perhaps indirectly)
-   Get rid of the "is removed" and just delete the object directly
-   To remedy this: Add methods to see if an object exists (anymore)
-   What happens on error with initialization?

## Solutions:

-   Only the top level thing is actually cleanUped
-   Mostly forward processing
-   No fragile logik
-   Clear Cut validation that everything got removed, even in case of errors
-   Every cleanup has a clear starting method/trigger
-   Remove operations should be as minimal as possible
-   We dont to extra cleanup on plugin user error (i.g. often Await cb, but ignore their errors)

Fazit: Need good diagrams to display how things work

## The general setup for removal is as follows:

1. Set removed to true
2. Callbacks
3. Remove from arrays and so on
4. "Remove from memory"
