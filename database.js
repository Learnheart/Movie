var mysql = require("mysql2");

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "khanhlinh2003",
  database: "movie",
});

module.exports = conn;
