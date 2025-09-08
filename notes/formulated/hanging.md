To detect if a process hang, we can:

regularly ping it and see if it responds

If it is a longer running process (single threaded) in can regularly post a message "hey, i am still alive"
=> Non hang message - as an alternative to timeouts we expect regular feedback to see everything is still fine

This is dangerous though! As it can still happen inside an infinite loop.
