Fix operation types.
=> Each frontend and backend should just define the things all on themselves with transformations betwen them based on Name

Backend <-> Frontend Operation
|                  |
v                  v
Result           Result


The backend should only have contents as strings... so might as well be a string store as originally envisioned


========================
========================

The base asset should have on the methods some data to collect the actions what has to be done for subscriptions / produce a "stream" of events

========================
========================

Some concerns with force_delete, force_write, etc. with correct recency token
