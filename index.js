var express = require('express'),
    exec = require('child_process').exec,
    fs = require('fs'),
    https = require('https');

var app = express();
app.use(express.static('public'));

app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
  res.send('index.html');
});

app.get('/v/:id', function (req, res) {
  res.render('v.html', { id: req.params.id });
});

app.get('/gif/:id', function (req, res) {
  var id = req.params.id,
      tmpdir = 'tmp/',
      gifdir = 'gif/',
      gifpath = gifdir + id + '.gif',
      videopath = tmpdir + id + '.mp4';

  fs.exists(gifpath, function (exists) {
    if (exists) {
      res.sendfile(gifpath);
    }
    else {
      var command1 = 'ffmpeg -i ' + videopath + ' -r 10 ' + tmpdir + id + '%05d.png',
      command2 = 'convert -colors 16 ' +  tmpdir + id + '*.png ' + gifpath,
      command3 = 'rm -f ' + tmpdir + id + '*.png ' + videopath,
      video = https.get('https://vine.co/v/' + id + '/card', function (response) {
        var url,
            data = [],
            file,
            request;
        response.on('data', function (chunk) {
          data.push(chunk);
        });

        response.on('end', function () {
          url = data.join('').match(/\<source src="([^"]*)"/)[1];

          file = fs.createWriteStream(videopath);
          request = https.get(url, function (response) {
            response.pipe(file);
            response.on('end', function () {
              var child1 = exec(command1, function (error, stdout, stderr) {
                var child2 = exec(command2, function (error, stdout, stderr) {
                  var child3 = exec(command3, function (error, stdout, stderr) {
                    res.sendfile(gifpath);
                  });
                });
              });
            });
          });
        });
      });
    }
  });
});

app.listen(4000);
