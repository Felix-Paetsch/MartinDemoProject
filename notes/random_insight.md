A plugin could have meta data which another plugin can request,
including default expected timeout or other quirks.

Debug system:
Each plugin randomly sends out a system of asserts it assumes on the other plugins (only works for full integrity)

File system:
Provider, ability to subscribe / unsubscribe..

WASM:

-   how does it work
-   do some testing
-   feedback loop how long it expects to take

SubPlugins (e.g. several shaders in one plugin)

=========

Also we maybe have to figure out a good API to deal with errors cases. The current way is a bit annoying, but also necessary?
Something something
const $ = new resolveOrThrowContext() // extends AsyncContext
const result = await $(env.get_library(), on_error, clean_up);

Here $ throws if there was an error, or otherwise returns the value. You can handle errors (maybe replacing them with something other, or doing a cleanup/rollbak) and you can specify what should happen as a cleanUp action when a) we are done or b) something threw
