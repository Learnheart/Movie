var mysql = require("mysql2");

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "ASPD1192",
  database: "movie",
});

module.exports = conn;
