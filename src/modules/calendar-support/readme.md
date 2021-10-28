# Calendar Support

The contents of this directory are used to create and update a small
database called "vrtournaments" that support Tennis Canada's
tournament calendar application.

The vrtournaments has a huge overlap with the entities in TCStats application.
In fact this "vrtournaments" database was a precursor to the TCStats
application.

We create two entities (tournaments and event) and a
corresponding service just syncs the tc_stats tournaments and events to
the calendar db ("vrtournaments");

That is all.

There is also a program that is run on a schedule that triggers the sync.

Ultimately this should go away and be replaced
by and API the Calendar application can use.
Alternately, the Calendar application should use the tc_stats
database directly, since it is virtually identical.
