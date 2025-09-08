# Message Partner

## Instanciation Flow

-   Plugin interacts with message partner
-   Message partner calls create_mpo

[when everything works well]

-   A: SEND -> Wanna create mpo
-   B: SEND <- UUID
-   A: Instanciate MPO (FailCase 1)
-   A: SEND -> OK
-   B: Instanciate MPO (FailCase 2)
-   B: Callback (sync, ignore error)
-   B: SEND -> OK
-   A: return

FailCase 1:

-   Send Fail Msg to B (async, ignore error)
    -   B aborts
-   Return Error

FailCase 2:

-   [B] Send Fail Msg to A (async, ignore error, exit)
-   [A] CleanUp (remove, WITHOUT remove callback)
-   Return failure

Timeouts:
[everything]

-   Clean Up locally without remove callback

## Remove Flow

[removeBOTH]
WHEN: MP.remove()

-   set is removed to false
-   send_remove_message [async, ignore error]
-   remove callback [sync, ignore error]
-   slice from message partners objects or message partner
-   return

[removeINTERNAL]
WHEN: on removing external

-   remove callback [sync, ignore error]
-   slice from message partners objects or message partner
-   return

[removeEXTERNAL]
WHEN: deleting the plugin the message partner lives with

-   set is removed to false
-   send_remove_message [async, ignore error]

## Monitoring

Todo: (Potentially) monitor if partner still alive and otherwise remove reference

## Utils

MP.ping()

## Notes

Sub-message partners arent automatically deleted when a message partner is to remove overhead of message passing. This has to be handled manually via...
