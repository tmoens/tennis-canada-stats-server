/*
 * Configuration for nodeorm
 * username & password need to be set properly for each deployment.
 *
 * The nodeorm entities are under src (.ts) when in development
 * and under dist (.js) in production.
 *
 * Requires that the NODE_ENV environment variable is set to "production"
 * when running the compiled version of the app.
 */
const SOURCE_PATH = process.env.NODE_ENV === 'production' ? 'dist' : 'src';

module.exports = {
  type: "mariadb",
  host: "localhost",
  port: 3306,
  username: "tc_stats_server",
  password: "tc_stats_server",
  database: "tc_stats_server",
  entities: [
    `${SOURCE_PATH}/**/*.entity{.ts,.js}`
  ],
  synchronize: false,
  logging: ["error"]
};