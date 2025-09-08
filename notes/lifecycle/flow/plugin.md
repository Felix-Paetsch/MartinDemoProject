# Plugin

## Start Plugin

-   Kernel.Start
-   Instanciate Plugin
    ...
-   End Proccess => Remove Plugin (for this we need to add timeout things)

Any error of the start plugin (or any local plugin) is a defect and will only be caught as a side effect to how things are set up!

## Other Plugins

### Get::Plugin

1. Plugin requests plugin address form kernel

Plugin -> Kernel

```
    if (exists plugin): kernel -> plugin: Plugin address
    else (Martin.create_plugin)
        if (error) self cleanUp, return error
        else return Plugin address
```

2. Plugin requests plugin message partner from plugin

Plugin A -> Plugin B
Plugin B creates message partner (cant error)
Plugin B responds (async)
Plugin A creates message partner

If there is an error we dont do any cleanup

[0. Martin create plugin]
register address
eval plugin
self-cleanup ofc

### Remove Plugin Partner

(see message partner)

### Remove Plugin

-   Kernel.remove_plugin
    -   Send remove plugin message - [Plugin] run callback (ignore error, await)
    -   for each plugin message partner call the remove fn (not waiting)
        Note that this means MPOs associated to them are not seperately also removed
-   [await response]
-   CleanUp from initializer
-   Remove from list

Note removal for the address and so one ought to be handled by the library env remove argument

## Utils

[TODO] Plugin.is_idle()
