var conn = require("./database");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/register", function (req, res) {
  res.sendFile(__dirname + "/users/register.html");
});

app.post("/register", function (req, res) {
  console.log(req.body);
  var userName = req.body.userName;
  var DOB = req.body.DOB;
  var phoneNumber = req.body.phoneNumber;
  var location = req.body.location;
  var password = req.body.password;

  conn.connect(function (error) {
    if (error) throw error;
    var userInsertSql =
      "INSERT INTO userAccount (userName, DOB, phoneNumber, location, password) VALUES (?, ?, ?, ?, ?)";

    conn.query(
      userInsertSql,
      [userName, DOB, phoneNumber, location, password],
      function (error, result) {
        if (error) throw error;
        res.redirect("/user");
      }
    );
  });
});

app.get("/user", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.log(error);
      return res.status(500).send("Internal Server Error");
    }

    var displayUser = "SELECT * FROM userAccount";
    conn.query(displayUser, function (error, result) {
      if (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/user.ejs", { user: result });
    });
  });
});

app.get("/food", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.log(error);
      return res.status(500).send("Internal Server Error");
    }

    var displayFood = "SELECT * FROM food";
    conn.query(displayFood, function (error, result) {
      if (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/food.ejs", { user: result });
    });
  });
});

app.listen(7000, function () {
  console.log("Server is listening on port http://127.0.0.1:7000");
});
