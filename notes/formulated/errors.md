## Complications with errors

-   Asynchronus
-   Errors from different actors (with hirachy)
-   Timeouts
-   Effect tracing vs standard tracing (in part. with browser incompatabilities)

=> Problems

-   Debuggability
-   Understandability
-   CleanUp & Synchronization

=> Solution Approaches

-   Clear Specification
-   Testing(including these specifications)
-   Plugin Library to not shoot feet

## Features to add:

-   Errors are logged using middleware
-   Errors have well defined tags/status codes to switch on
-   All Effect.ignore and Effect.die's are reviewed

## Design Goals

-   Errors get communicated between Plugins (Mostly when seeing Kernel as a plugin)
-   Errors get escalated from Plugin to Kernel if neccessary
-   Errors are handled gracefully by the kernel and are easy to be handled gracefully by plugins

-   On crash a plugin loses/corrupts only minimal amount of its data (i.e. saving to disk)
-   Easy synchronizations, rollback functionality => combination with undo?!

-   Errors are understandible
    -- what is the chain of errors caused by the first failure?
    -- over which plugins does it span?
    -- option to hide some of this info (later)
    -- compatible with WASM

## Fazit

-   A very good solution has to wait for
    -- After Kernel integration => Keep momentum; most things debuggable (vs safely functional) without these goals
    -- More Undo/Redo thoughts (seems related; rollback)

-   good .Die, .Ignore and Ensuring hygine with clear design docs

-   Random failures
-   We trust martins code (and mine)
