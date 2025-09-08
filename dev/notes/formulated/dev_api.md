# The current plugin dev API is hard and difficult to use.

=> Have handles to better deal with the response objects. E.g.

```ts
const $ = new resolveOrThrowContext(); // extends AsyncContext
const result = await $(env.get_library(), on_error, clean_up);
```

Here `$` throws if there was an error, or otherwise returns the value. You can handle errors (maybe replacing them with something other, or doing a cleanup/rollbak) and you can specify what should happen as a cleanUp action when
a) we are done (or smth later through) or
b) something threw
