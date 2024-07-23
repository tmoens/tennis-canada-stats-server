# Calendar Support

The contents of this directory are used to create and update a small
database called "vrtournaments" that support Tennis Canada's
tournament calendar application.

The vrtournaments has a huge overlap with the entities in TCStats application.
In fact this vrtournaments database was a precursor to the TCStats
application.

We create two entities (tournaments and event) and a
corresponding service just syncs the tc_stats tournaments and events to
the calendar vrtournaments database.

That is all.

There is also a program called updateCalendarTournaments.ts that runs on a 
schedule that triggers the sync.

Ultimately this should go away and be replaced by and API the Calendar 
application can use rather than making a mini copy of the database.
