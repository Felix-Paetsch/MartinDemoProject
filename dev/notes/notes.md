-   We need support for p5.js
-   GPU accallerated as easy as p5.js
-   Power Users

Topics:

-   Welche Menschen ansprechen?
-   Groß vs klein?

Todo:

-   Better versioning utils
-   Better callback utils
-   Reduce the amount of orDies / run / runSync

Use Effect.fn
Create and annotate spans
Effect.log => For spans
When returning error and translating Effect <-> TS give span and so on

-   Wenn es gut läuft sind wir an einem guten Ort
    => Wie kommt man an Modell?

const er = Cause.prettyErrors(e)[0];
Cause.pretty
=> Look more into cause
run => Only await promises we want to await

Later: OTEL

Idee:
Plugin als Funktionen
Plugin als Klasse??

TODO:

-   Debug Middleware
-   Better Kernel Support
-   Shut Down etc.

Reduce possible Errors with protocols
Abstract from Protocols? (deabstract?)
What is wierd about the usage:

-   We use mostly singletons
-   We mainly want the middleware and one specific send fn
-   Sometimes asymmetric
-   Often dont use callback
-   Return result is a joke..
-   When getting the middleware for a protocol, we can directly register it aswell
-   Different Protocols do very similar things...

-   Bind things as early as you can
- refactor protocols, move logging middleware to messaging 

For result:

Result <-> Result Promise
Assert it is something / How do we deal with that we now always have error return type?
... just effect...

Effect.ts

If we respond to a message w/o awaiting a request, it should be in the headers

-   Unsubscribing from bridge, etc
-   Kernel Handler
-   Deeffect safely
-   Signals
-   CleanUp eventlisteners => Get rid of some state <3
-   Aquire/use/release?
-   Effect.fn
-   Config
-   User Layers (Env might be a layer...)
-   handle removes for MPOs better
    wiggled exponential decay remove requests
    remove locally
-   Create object ~ cleanup => Clean Signal implementation
-   Remove callbacks

How do other places use effect?

We first await (and reject) promise. Then we get around resolving it

# Notes on Effect

-   Effect likes factories-ish more than classes
-   Few sideeffects & immutability
-   Effect has a learning curve
-   Schemas are awesome
-   Classe: self.seminglystaticstuff => Allow for effects to have arguments other than requirements or fun arguments

# Questions

-   Should Middleware be able to throw errors?
-   What to do with generic (error)listeners?
-   What to do with environment inactive errors?
-   How to generalize message_parner_protocols
-   What to do against double responses on protocols?

# To research

-   How to do servers in Effect, F# and functional programming?

# Axioms

xxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxx

Already here/the same:

-   open communication channel
-   parts of client

Difference:

-   current kernel emposes queus
-   difference workload/message // Nachrichten Modell

-   3rd party / encryption / security / Datentransfer

2 Points:

Unsere Prios sollten sein

-   größter Mehrwert ist Infrastruktur / Entwicklern Last abnehmen
    ----> Infra / Security / Payments
-   Infra: Nur frontend für Plugins, ein paar APIs von uns nutzen und ein paar Optionen bei uns setzten
-   3rd Party!
    (machen vor: große Daten austauschen)

Queus etc. nicht erwähnt
/////////////////////////

-   altes System als OptIn möglich
-   Geschindigkeit
-   Es wird mir Komplexität induziert

-   We cant control people stop computations
-   Responsiveness

Teile unserer Struktur nicht mehr emposen
-> Was ist die Alternative?
Probleme:
Debugging, Mental Model for Developer
=> Sync code der zuende läuft, Einheit an Code der am Stück zuende läuft

-   DOM events
-   Viel async wird versteckt
-   zu viel Komplexität?
-   Interne Komplexität vs overaching Komplexität

###########
Notes:
Versioning

###########
Benutzung von Blockern:
Long long await
for deleting something

###########
Debugging:

-   Pausieren
-   Step through!
-   Replay (with send Messages?)

Von wem erwartet man Nachrichten
~ visualisierung(?)
Graphen w/ edges and what is transported along these edges

Idee von Schaltkreisen - Abläufe die verteilt funktionieren
~> Add "logging line"

Concept of Message chain!

====

Lsg für Debugging/Testing

Kernel in End-to-End Situation mit Plugin verbinden
(aussuchen was "Plugin" überhaupt ist ~ vernetzung)
Test/Debug demonstrieren

Momentan testen: Record Ablauf; Playwrite

-   deterministisch
