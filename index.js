var conn = require("./database");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
// const { error } = require("console");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/register", function (req, res) {
  res.sendFile(__dirname + "/users/register.html");
});

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve the revenue HTML
app.get("/revenue.html", (req, res) => {
  res.sendFile(__dirname + "/revenue.html");
});

app.post("/register", function (req, res) {
  console.log(req.body);
  var userName = req.body.userName; // corrected from req.body.name
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
        // res.send("Create new account successfully, ID: " + result.insertId);
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

app.get("/revenue", (req, res) => {
  const sql = `
    SELECT m.movieID, m.title AS movie_title, 
           COUNT(t.orderTicketID) AS tickets_sold, 
           SUM(t.price) AS total_revenue
    FROM movie m
    LEFT JOIN scheduleMovie sm ON m.movieID = sm.movieID
    LEFT JOIN ticket t ON sm.scheduleID = t.scheduleID
    GROUP BY m.movieID, m.title
    ORDER BY m.movieID;
  `;

  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing the query:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

// DEMO
app.get("/demo", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.log(error);
      res.res.status(500).send("Internal Server Error");
    }
    var topMoviesQuery = `
    SELECT m.movieID, m.title, AVG(fb.rate_status) AS averageRating
    FROM movie m
    LEFT JOIN feedback fb ON m.movieID = fb.movieID
    GROUP BY m.movieID, m.title
    ORDER BY averageRating DESC
    LIMIT 3;
  `;
    conn.query(topMoviesQuery, function (error, result) {
      if (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/demo.ejs", { movie: result });
    });
  });
});

// Serve the top-rated movies
app.get("/rating", (req, res) => {
  const topMoviesQuery = `
    SELECT m.movieID, m.title, AVG(fb.rate_status) AS averageRating
    FROM movie m
    LEFT JOIN feedback fb ON m.movieID = fb.movieID
    GROUP BY m.movieID, m.title
    ORDER BY averageRating DESC
    LIMIT 3;
  `;

  conn.query(topMoviesQuery, (err, results) => {
    if (err) {
      console.error("Error executing top-rated movies query:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

// Endpoint to handle requests for top 5 timeschedules
app.get("/timeschedule", (req, res) => {
  const topTimeschedulesQuery = `
    SELECT sm.scheduleID, sm.day, sm.time, COUNT(t.orderTicketID) AS totalTicketsSold
    FROM scheduleMovie sm
    LEFT JOIN ticket t ON sm.scheduleID = t.scheduleID
    GROUP BY sm.scheduleID
    ORDER BY totalTicketsSold DESC
    LIMIT 5;
  `;

  conn.query(topTimeschedulesQuery, (err, results) => {
    if (err) {
      console.error("Error executing top timeschedules query:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

app.listen(7000, function () {
  console.log("Server is listening on port http://127.0.0.1:7000/register");
});
