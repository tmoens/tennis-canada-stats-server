# TC Stats Server
Is just a collection of programs to collect and analyze Tennis Canada tournament and league play statistics.

It is written using the NestJS framework.

## Installation

```bash
$ npm install
```

## Build
```bash
$ nest build
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
npm run start:prod
```

## Configuration

You need to fill in a development.env and production.env file using example.env as a guide.

## Notes about the existing deployment

## Database

For historical reasons there are two versions of mysql installed.
One is of the xampp stack (C:\xampp\mysql) which runs on the normal
port 3306.

The other is a newer straight MariaDB installation under 'C:\Program Files'. 
Until we can safely remove the old one, the new one runs on port 3307.

In the MariaDB installation the database user-name is tc_stats_server.
The database is called tc_stats.


## Backing up the database

Francis set up a script to do daily backups automatically.

Sometimes you need to do a manual backup. Like before and upgrade with a database migration.
If using powershell use 
```
mysqldump -u tc_stats_server -p tc_stats --result-file=[filename]
```
