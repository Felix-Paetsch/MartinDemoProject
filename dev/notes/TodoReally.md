# General
- Build demo
- Simplify simplify simplify (refactor)

# Assets
- JSON patching (caching)
- Persisting
- Kernel System files (like loaded plugins)
- Bug fixes
- Exfiltrate data
- Non JSON-assets (i.e. Assets that are images and pulled from somewhere)

# System
- Error update (good errors; transmitting serialized errors; Errors are transmitted / thrown and not ignored / error management / better errors)
- System for martin plugin drag and drop (local and non-local)
- Loading/Describing plugins with different names/versions
- Clearn Refactor
    - the same core should work for hosting node and browser projects
    - compatments
- UI interface
- Plugin Meta Data

# Documentation
- Document message flows (see martin notes)
    - in theory can write API against it to see in the logs if these flows are kept in tackt. But would nice logic for that
    - good property testing (?) Certain messages should be in some order...  

# Debugging
- See documentation
- Property Testing API on Logging (see if logging or msg format has to be improved though)
- Property Testin API on Files (file changes)

# Important Hard Improvements
- Debug Tools (Logging; Asset (changes))
- Clean Up (when it comes up eventually)

# Important Unknown
- Undo / Redo
- Timeouts & co.
- Recovery / Observability
- Idle plugins
- Interruption
- Less lags with extended async/await infra
- Figure out common Async problems (and be careful abt them)
- Replayability (of e.g. Property Tests)

# Learn About
- Async / Multithread
- Async / Multithread debugging/replayability

# Eventual Improvements

- Look at logs and group messages / get rid of unneeded ones
- Advanced communication channels (under the hhod retry, ...)
- Event/Error listener suite
- Test/replay on plugins the messages from the outside world
- A wrapper plugind to communicate with some system in maybe another language via messages
