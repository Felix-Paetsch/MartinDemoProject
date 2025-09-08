# We need good debug tools.

Partially for me, mostly for plugin developers.

## Problems

-   Distributed Sytem
-   Code we don't control
-   Effect is not ideal with tracing

## Existing debug tools

(Log Debugging)
Browsers and node have increasingly powerful debug tools. Thus it is useful that code can run in both environments and these debug tools are useful.

## Plugin Environments

Ideally plugins can be run in seperate environments (maybe even a debug environment) - e.g. local/WASM/iframe - without difference in logic from the plugin side and maybe with better debug tools
(JA)

## Logging

There (already implemented) is a logging system for plugins to
a) Log messages passed
b) Log data
currently either to a file [node] or a global object [browser]. The latter can eventually be expanded to exfiltrate data via http.
These logs have some functionality around them to query them.

=> Unified logging system (?)

## Future ideas / requirements

-   Performance Analysis
-   Graph to see which plugins communicate what message
-   Replayability, State Dumps, ...

## See also

-   Errors
-   Testing
-   CleanUp

## Debug - Build

## Martin toughts

-   Principal: Präventiv handeln

    -   Dinge einschränken: Bridges, Libraries
    -   Deklarativ

-   (gut in NextJS:) Sever Pfade + API endpoints am selben Ort
    -   UI zusammen mit Endpunkten erstellen
    -   Template Project
