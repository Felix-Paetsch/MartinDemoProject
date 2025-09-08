# Library

## Get::Plugin

Plugin requests library address form kernel
The library is assumed to be compatible with stateless-ness
In particular each library (as long as compatible) is only instanciated once

The kernel creates library [Martin] and responds with error potentially
No cleanup actions are taken.

### Remove Library Partner

Just the move the thing locally without any message being passed around
~ cpr Message partner object: Remove internal

### Remove Library

-   Kernel.remove_library
-   (this only happens in exceptional cases or when no plugin depends on this library => no cleanup methods for plugins with library partner)
    -   Run remove library method
    -   Remove library from kernel

Note removal for the address and so one ought to be handled by the library env remove argument

## Utils

[TODO] Plugin.uses_library()
[TODO] Library.is_alive smth smth
[TODO] Library -> self cleanup WATCH DOG
