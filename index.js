const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

//my app
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

//connect to mongodb using environment variable
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//make user schema
let user_schema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

//make exercise schema
let exercise_schema = new mongoose.Schema({
  user: String,
  description: String,
  duration: Number,
  date: String
})

let User = mongoose.model('User', user_schema);

let Exercise = mongoose.model('Exercise', exercise_schema);

//create new user
app.post("/api/users", (req, res) => {
  let user = new User({
    username: req.body.username
  })
  let id = user._id.toString()
  user.save()
  res.json({
    "username": req.body.username,
    "_id": id
  })
})

//get all the users in the db
app.get("/api/users", (req, res) => {
  User.find().then(users => {
    res.send(users)
  })
})

//add exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  let id = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date;

  if (!date) {
    date = new Date().toDateString()
  } else {
    date = new Date(date).toDateString()
  }

  let exercise = new Exercise({
    user: id,
    description: description,
    duration: duration,
    date: date
  })
  exercise.save()


  User.findById(id, (err, user) => {
    let username = user.username;
    res.json({
      _id: id,
      username: username,
      date: date,
      duration: duration,
      description: description
    })
  })

})

//get user's logs
app.get("/api/users/:_id/logs", (req, res) => {
  let id = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = parseInt(req.query.limit);

  User.findById(id, (err, user) => {
    let username = user.username;
    Exercise.find({ user: id })
      .select({ _id: 0, user: 0, __v: 0 })
      .exec(
        (err, docs) => {
          let exercise = [];
          for (let i = 0; i < docs.length; i++) {
            let date = Date.parse(docs[i].date)
            if (!(date < Date.parse(from)) && !(date > Date.parse(to))) {
              exercise.push(docs[i])
            }
            if (exercise.length == limit) {
              break;
            }
          }

          if (from) {
            from = new Date(req.query.from).toDateString();
          }
          if (to) {
            to = new Date(req.query.to).toDateString();
          }

          res.json({
            _id: id,
            username: username,
            from: from,
            to: to,
            count: exercise.length,
            log: exercise
          })
        }
      )
  })
})
