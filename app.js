var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var redis = require('redis').createClient();
var moment = require('moment');

const path = require('path');

app.engine('hbs', exphbs({defaultLayout: 'index', extname: '.hbs', layoutsDir: 'views/'}));
app.set('view engine', 'hbs');
app.set('port', (process.env.PORT || 3000));

app.get('/', function (req, res) {
  res.render('index', {name: 'index'});
});

app.get('/:dashboard', function(req, res) {
  res.render('index', {name: req.params.dashboard, layout: false});
});

app.get('/widgets/:widget.json', function(req, res) {
  redis.get(req.params.widget, function(err, reply) {
    if(err) {
      res.json({'error': err});
    } else {
      var reply_json = JSON.parse(reply);
      var next_time = moment(reply_json.next_time);
      delete reply_json.next_time;
      var now = moment();
      if (now.isBefore(next_time)) {
        reply_json.updates_in_millis = moment.duration(now.diff(next_time)).asMilliseconds();
      } else {
        reply_json.updates_in_millis = 5000;
      }
      res.json(reply_json);
    }
  })
});

app.listen(app.get('port'), function () {
  console.log("Up and running on port " + app.get('port'));
});

// Serve our bundle
app.use("/assets", express.static('build'));

// load our jobs
require(__dirname + '/jobs.js');