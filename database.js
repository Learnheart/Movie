var mysql = require("mysql2");

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bong2402",
  database: "movie",
});

module.exports = conn;
