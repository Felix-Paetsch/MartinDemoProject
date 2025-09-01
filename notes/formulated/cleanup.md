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
