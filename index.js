var express = require('express'),
    exec = require('child_process').exec,
    fs = require('fs'),
    https = require('https');

var app = express();
app.use(express.static('public'));
app.use(express.logger());

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
    console.log('GIF ' + id + ': checking if we already have it');
    if (exists) {
      console.log('GIF ' + id + ': bingo! We have it, streaming...');
      res.sendfile(gifpath);
    }
    else {
      console.log('GIF ' + id + ': shoot.. apparently this is the first time someone wants this gif');
      console.log('GIF ' + id + ': fetching video URL');

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
          try {
            url = data.join('').match(/\<source src="([^"]*)"/)[1];

            file = fs.createWriteStream(videopath);
            console.log('GIF ' + id + ': downloading video');
            request = https.get(url, function (response) {
              response.pipe(file);
              response.on('end', function () {
                console.log('GIF ' + id + ': creating PNGs');
                var child1 = exec(command1, function (error, stdout, stderr) {
                  console.log('GIF ' + id + ': creating GIF');
                  var child2 = exec(command2, function (error, stdout, stderr) {
                    console.log('GIF ' + id + ': removing temporary PNGs');
                    var child3 = exec(command3, function (error, stdout, stderr) {
                      console.log('GIF ' + id + ': streaming GIF');
                      res.sendfile(gifpath);
                    });
                  });
                });
              });
            });
          }
          catch (e) {
            res.redirect('/');
          }

        });
      });
    }
  });
});

app.listen(4000);
