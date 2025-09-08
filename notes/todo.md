1. Handle everything gracefully - and write specification
2. Review effect.ignore's and finalizers
3. Add logging on error cases
4. Review if we need a refactor
5. Review if we really need cleanup logs
6. Consider fancy things: make all callbacks have JSON => Promise<void>; timeouts

-   What abt Middleware errors? (unexpected ones)
-   Plugin.is_idle() - when requested a plugin, but it did its thing and now noone wants something from it. Idle should be an obt out and not opt in.. (?)
    => How much ability to shoot into foot?

-   timeouts caused by long callbacks should be triggered on the callback execution function
    (ideally with interruption)
-   Interruption? Defence against it?

-   Eventually: Write out several message flows, maybe inside a folder on paper or so
-   Why is there an extra address for messaging with local environments in the browser compared to node?
-   Overwrite ResultPromise
-   export ProtocolError
-   better errors

-   Still debug logging

-   Sport
-   Move to new System
-   Locally Computed Message Data
-   Inactive Environment
-   Get Known addresses
-   Clean Up
-   Current Effects are not stateless when not executed
-   Make plugin lib and co into Effect.fn; specifically registering plugins
    Good back and forth integration of effect errors and own errors; in particular maybe done want to translate both back and forth.
-   resultFunc

Allow for advanced communication channels:

-   Under the hood several channels
-   Retry logic
-   Notify kernel
-   Allowing to keep middleware
-   Error handlung callbacks & cokg

-   look at current things
-   less effect in martin initialization
-   allow async callbacks everywhere
-   testing (an array/set of test scenarios that should just work)

-   maybe explicit result promise extends promise
-   local env should not be that different from non-local
-   unify how we put mw
-   debug annotation
-   Why is current sender not current source ==> Bcs its a local environment (I think)
    ==> Local Plugin Environment?

-   Listener Suite
-   Wider communication Channels
