// Import module
var conn = require("./database");
var express = require("express");
var session = require("express-session");
var app = express();
var bodyParser = require("body-parser");

app.use("/css", express.static("public/css"));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// handle json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/homepage", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var displayMovieRand =
      "SELECT distinct movieID, title, description FROM available_movie ORDER BY RAND() LIMIT 4;";
    conn.query(displayMovieRand, function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/view/homepage.ejs", { homepage: result });
    });
  });
});

// Registration route
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

        // Fetch the inserted user's ID
        var userIdQuery =
          "SELECT userID FROM userAccount WHERE phoneNumber = ? LIMIT 1";

        conn.query(userIdQuery, [phoneNumber], function (error, userResult) {
          if (error) throw error;

          // Store the user ID in the session
          req.session.userId = userResult[0].userID;
          console.log("User ID:", req.session.userId);

          res.redirect("/login");
        });
      }
    );
  });
});

// Login route
app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/users/login.html");
});

// Login route
app.post("/login", function (req, res) {
  var phoneNumber = req.body.phoneNumber;
  var password = req.body.password;

  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var loginQuery = "SELECT * FROM userAccount WHERE phoneNumber = ? LIMIT 1";

    conn.query(loginQuery, [phoneNumber], function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
      }

      if (result.length > 0) {
        // Compare the entered password with the stored password
        if (password === result[0].password) {
          req.session.userId = result[0].userID;
          res.redirect("/homepage");
        } else {
          // Failed login, redirect to login page with an error parameter
          res.redirect("/login?error=1");
        }
      } else {
        // Failed login, redirect to login page with an error parameter
        res.redirect("/login?error=1");
      }
    });
  });
});

// Get user account
app.get("/user", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var displayUser = "SELECT * FROM userAccount";
    conn.query(displayUser, function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/user.ejs", { user: result });
    });
  });
});

app.get("/movie", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var displayMovie =
      "SELECT distinct movieID, title, description FROM available_movie ;";
    conn.query(displayMovie, function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
      }
      res.render(__dirname + "/view/movie.ejs", { movie: result });
    });
  });
});
// Add a route for movie detail
app.get("/movieDetail/:movieID", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var movieID = req.params.movieID;
    var getMovieDetail = "SELECT * FROM available_movie WHERE movieID = ?";
    conn.query(getMovieDetail, [movieID], function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
      }
      var title = result[0].title;
      var category = result[0].category;
      // Render the movie detail page with the fetched data
      res.render(__dirname + "/view/movieDetail.ejs", {
        title: title,
        category: category,
        releaseDay: result[0].releaseDay,
        length: result[0].length,
        movieID: result[0].movieID,
        movieDetail: result,
      });
    });
  });
});

// Add a route for available seats
app.get("/availableSeats/:movieID/:scheduleID", function (req, res) {
  conn.connect(function (error) {
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    var movieID = req.params.movieID;
    var scheduleID = req.params.scheduleID;

    // Fetch movie details, schedule details, and available seats
    var getDetailsAndSeats =
      "SELECT * FROM available_movie WHERE movieID = ? AND scheduleID = ?";

    conn.query(
      getDetailsAndSeats,
      [movieID, scheduleID],
      function (error, result) {
        if (error) {
          console.error(error);
          return res.status(500).send("Internal Server Error");
        }

        // Check if any results are returned
        if (result.length === 0) {
          return res.status(404).send("Movie or schedule not found");
        }

        // Fetch available seats using your procedure
        var getSeatsProcedure = "CALL DisplayRoomAndSeats(?, ?)";
        conn.query(
          getSeatsProcedure,
          [movieID, scheduleID],
          function (error, seatsResult) {
            if (error) {
              console.error(error);
              return res.status(500).send("Internal Server Error");
            }

            // Render the available seats page with the fetched data
            res.render(__dirname + "/view/availableSeats.ejs", {
              movieDetail: result[0], // Use the combined result
              availableSeats: seatsResult[0],
            });
          }
        );
      }
    );
  });
});

app.listen(7000, function () {
  console.log("Server is listening on port http://127.0.0.1:7000");
});
