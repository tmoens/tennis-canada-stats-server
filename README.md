# TC Stats Server

**DO NOT PUT THE PRODUCTION CONFIGURATION IN SOURCE CONTROL**

Tennis Canada Stats Server is actually a set of server side programs that 
collect and analyze Tennis Canada tournament and league play statistics.

These server side programs are written in Typescript using the NestJS framework.

The server side programs make use of MariaDB through an Object Relational
Mapping Tool called TypeORM.

The server requires Node to be run.

## Relationship to Tennis Canada Stats Admin Client

These server side programs support a corresponding client side which provide 
Tennis Canada with a number of tools for managing and analysing Tennis 
Canada's competitive tennis programs. The tools are collectively known as 
the Tennis Canada Stats Admin Client and are maintained in a separate 
repository.

## Setup

### Install Node and NPM

See the package.json file for the version of NestJS and check NestJS 
documentation for the required version of Node on the server.

### Installing NestJS Framework and libraries

```bash
$ npm install
```

### Building the Server Side Programs

```bash
$ nest build
```

The server side programs will all be located under the dist directory.

## Notes about the existing deployment

The servers currently run at statsadmin.tenniscanada.com.

The code is at C:/Users/Ted/WebstormProjects/tennis-canada-rankings-server

The configuration is in the /environments directory.

## Configuration

**DO NOT PUT THE PRODUCTION CONFIGURATION IN SOURCE CONTROL**

There are a number of configuration parameters that need to be set to
run the servers in development or production mode.
The configuration files are in the /environments directory.
They contain passwords for the database, the VR aAPI and the ITF API and
thus should never be stored in the git repository.  
The current version in live deployment has good settings.

### NestJS and TypeORM Configuration

This can get quite complicated.
NestJS wraps TypeORM in its own layer to enable its idiosyncratic style. 
Some of the TypeORM configuration variables are sourced from the 
configuration file (production.env).

But most of the application wiring happens in src/modules/configuration.
The most complicated part is because there are two databases that need to be 
used - one that contains all the data from VR and the other that contains a 
small subset of that data used to run Tennis Canada's calendar application.

## The Servers

The servers are a set of Typescript programs. 

The all use the same configuration data as described above.

These programs are each either run on a schedule or on demand, as described 
below.  On the production system, schedules are configured in the Task 
Scheduler application on Windows.

### Tennis Canada Stats Server (main.ts)

#### Purpose
This program provides an API to the Tennis Canada Stats Client to support 
various applications.

#### Notes
The stats server runs on a port that is set in the configuration. Traffic from
the Stats Client directed to this API is redirected to the appropriate port in
the Webserver (apache) configuration.

For details on all the client applications supported by this server, see the 
Tennis Canada Stats Client repo.

This server produces lots of logs in the logs directory and reports in the 
Reports directory.  

#### Schedule
This server is persistent. In the production environment the Windows Task 
Manager is supposed to restart it if it fails.

### Load VR Tournaments (loadVRTournaments)

#### Purpose
This program is responsible for pulling all play (tournament, league, 
box-ladder) data from VR (using their API) and storing it in the main database 
(tc_stats_server).
#### Notes
Configuration for VR API access is in the config file.

This includes the tournaments, events, draws, matches, players and mores.
The data is used by Tennis Canada for reports and analysis.
Tournaments are loaded whether play has started or not.
In that way there is up-to-data about all planned tournaments and leagues.
The loader uses this simple approach:
- get a list of all the tournaments run this calendar year and last
- for each one if the version we have stored for the tournament is older 
  than the version VR has, delete our version and reload the whole 
  tournament from VR.
#### Schedule 
This program runs hourly.
While this may seem frequent, it is required to make sure that the data used 
to drive the Tennis Canada Calendar application is never far out of date.  
It also means that reports will always be based on very recent data.

### Load VR Rankings (loadVRRankings)
### Purpose
This program keeps a history of rankings in every category for every week 
since 2013. It uses the VR API to collect this data.
#### Notes
Configuration for the VR API is in the config file.

The main use rankings data is for a report that computes the strength of a 
particular event after it has been played.  If an event has higher ranking 
participants, it is deemed to be stronger than an event with lower ranking 
participants.  This allows Tennis Canada to determine if a tournament or an 
event within a tournament deserves a higher or lower rating.

It is also the case that VR only provides ranking history for only two years,
and so at this point, Tennis Canada has the ability to use or present a much 
richer historical view if they were to choose to do so.

It is possible that once rankings are published, they can later be changed. 
For that reason, the same kind of loading algorithm is used as with loading 
tournaments.  That is, if our rankings for a particular week are out of date,
delete them and reload from VR.

#### Schedule
This program runs daily. Rankings updates are infrequent and there is no 
critical need to keep it up to date with smaller window.

### Load ITP, ATP and WTA Results (loadITFData)
#### Purpose
This program collects data for Canadians playing in ITF, ATP and WTA events.
It uses an API provided by the ITF.
#### Notes
Configuration for the ITF API is in the config file.

Results for Canadians playing in WTA, ITF and ATP events count towards the 
players rankings.  This program enables Tennis Canada to collect those 
results.

Note: The ITF API does not always provide complete or correct results in a 
timely fashion.  Therefore, there is an application that Tennis Canada uses 
to review this data and correct it as necessary.  That application is 
supported by the API provided by the main stats server program.

The data from these tournaments is then exported manually to VR so that ranking 
points are applied to player rankings. This process is done by Tennis Canada
administrators.

#### Schedule
This program runs hourly to keep data up to date.

### Update the Tennis Canada Calendar Database (updateCalendarTournaments)
#### Purpose
This is standalone program that reads the stats database and populates the 
database used to support the Tennis Canada Calendar application.

#### Notes
This is very much an ad-hoc job.  The main purpose is to maintain a stand-alone 
database for the Tennis Canada Calendar application to use to present its 
web pages.

The Calendar app originally read the stats database directly.  Of course, it 
should have used an API, but at the time there was no one to develop an API 
and so SQL calls were made.  Though practical, it was a horrible decision 
because it meant that if this system changed its database, the Calendar 
application might go down.  So, a decision was made to have a program 
extract data from the stats database and populate the calendar database as a 
way to decouple changes.  Of course this means that if the stats database 
changes, the updateCalendarDatabase code has to be checked to see if it is 
affected.

#### Schedule
This program runs every hour so the calendar database is up-to-date and the 
Tennis Canada Calendar application is also up-to-date.

### Create Play Data Export for UTR (GenerateUTRReport)
#### Purpose
This program reads the play data database and creates an Excel spreadsheet 
which includes every match played within a recent window.  UTR pick up this 
file in order to do their ratings.
#### Notes
The spreadsheet this program produces is in a very specific format agreed to 
with UTR.  UTR was not interested in an API.

The output of the program goes to a directory (as set in the config file).  
Tennis Canada provides access to that directory via SFTP for UTR to pull the 
reports.

The size of the window is also configurable and generally set to 14 days.  
This means UTR does not need to pull the report every 2 days and often they 
do not.

#### Schedule
The program runs every other day.  It can also be triggered manually by the 
TC Stats Admin Client.

#### Match Competitiveness Report (generateMatchCompetitivenessReport)
#### Purpose
This is a report that lists the match history in the stats database. Each 
match is augmented with a "competitiveness" level which is a number 
indicating that a match was somewhere between very competitive (e.g. 7-6, 6-7, 
7-6) and not at all competitive (e.g. 6-0, 6-0).

#### Schedule
It is run on demand using the Tennis Canada Stats Admin Client.

## Running the Server

Before you run, please set the environment variable NODE_ENV to 'production' or 'development'
```bash
export NODE_ENV=production
```

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
npm run start:prod
```
For the other programs, look at the configuration of the Task Scheduler on 
the deployment server.

## Database

The server talks to TypeORM which in turn talks to the database directly.
The configuration for the connections is in the production environment file.

### Backing up the database

Tennis Canada set up a script to do daily backups automatically.

Sometimes you need to do a manual backup. Like before and upgrade with a database migration.
If using powershell use 
```
mysqldump -u tc_stats_server -p tc_stats --result-file=[filename]
```
## Mail Server

The system needs to send email messages for things like password resets.
It uses a NestJS wrapper around nodemailer to do that.  The configuration 
file provides the information the server needs to communicate with the mail 
server.

## TODO

1. I added a library "dom" to the tsconfig.json file which solves a compile 
   problem BUT does not belong here in a node environment on the server side. 
   It is probably not required anymore.

