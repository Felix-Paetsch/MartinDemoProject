Todo: Transmit errors correctly
PMP.branch
PMP.clone

Given an array of operations to be performed atomically:

- First Check if there are subscriptions: If so, make sure we have subscription setup (message partner)
- Then send over data

On the other side:

First to stateless things that can fail
Then do stateful things that can fail
Then do things that can never fail


Read Can Fail
"FILE"
"FILTER_BY_META_DATA"
"FILTER_BY_META_DATA"

Small sideffect can fail
"SUBSCRIBE"
"UNSUBSCRIBE"

"CREATE"
"DELETE"
"FORCE_WRITE"
"WRITE"
"PATCH"
"SET_META_DATA"
"FORCE_SET_META_DATA"
"UPDATE_META_DATA"
"DELETE_BY_META_DATA"

