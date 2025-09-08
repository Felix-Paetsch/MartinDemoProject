# Plugin

A plugin is a self-contained, potentially encapsulated unit of (stateful) compute.

## Instanciation

-   [Plugin] get_plugin ()
-   [Kernel] get_plugin ~ plugin not already found
-   [Kernel] create_plugin
    -   create env and so on
    -   run plugin
-   [Kernel] return plugin reference to plugin

Errors: On creating env and on running plugin

## References

-   PluginEnv
-   [Kernel] Plugin Reference
-   [Plugins] Plugin Reference
-   [Msg Lib] Address
-   [Msg Lib] (In seperate process - if needed)

## Cleaup implies cleanup

-   Message Partners

## Cleanup tasks

-   Remove plugin reference in kernel
-   Call plugin cleanup method
-   Call Message Partner cleanups
-   CleanUp plugins elsewhere
-   CleanUp address
-   CleanUp address elsewhere

## Cleanup trigger

-   Remove self
-   Kernel intervention (e.g. on unresponsive)
    => Kernel intervention is official starting point of cleanUp

## Order of cleanup

-   [optional] ~ remove self
-   [entry] ~ KernelEnv.remove_plugin()
-   reference.remove()
    -   send remove message
        -   remove self callback
        -   remove message partners [includes own reference]
    -   set is_removed to true
    -   call cleanup methods kernel side
        -   remove from address
        -   UI remove, ...
-   slice from list of known plugins

## On error / unresponsive

Note there is only only call

Kernel <-> Plugin

If it doesnt go through:
a) Plugin unresponsive
b) CleanUp took longer than expected
Both cases for now: Just kill 'em

For remove message partners, note that we cant refer back to the plugin really as it could already have been removed.
=> When removing a message partner only the top level message partner removed is removed and whether the callback of the rest is triggered
depends on the other side.
