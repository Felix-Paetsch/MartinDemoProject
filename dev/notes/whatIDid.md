[+ Fazit]

Allow to exfiltrate messages
=> Currently not used, although some implementation to exfiltrate cleanUp process

How to securely/efficiently do cleanUp (and verify current implementation is ok)
=> Axioms!
=> Problem: Timeout
=> Documentation!!!
Currently writing out message flow between objects for different actions, including error paths
(For own testing)

-   => LongTerm: Own Markup language
-   [as in: systematic way to describe on paper the control flow - UML.ish]
    -   What?
    -   Which environment?
    -   What happens on which errors / conditions?
    -   (In which method block/on whose responsibility does this take place)
    -   What error message/code

Plans for the future:

-   Work Part Time on assets
-   Part Time on refactor, cleanUp tasks [including things like garbage collection]

Example:

-   Plugin.is_idle() - when requested a plugin, but it did its thing and now noone wants something from it. Idle should be an obt out and not opt in.. (?)
    => How much ability to shoot into foot?
    => System of Plugins that allows users to not worry [Auto CleanUp]
    => libraries; many things should use libraries
    => (optional!) libraries should either be discoverable or existing plugins should be easily extensible with libraries
    => libraries can be files!
