var express = require('express'),
    exec = require('child_process').exec,
    fs = require('fs'),
    https = require('https');

var app = express();
app.use(express['static']('public'));
app.use(express.logger());

app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
  res.send('index.html');
});

app.get('/v/:id', function (req, res) {
  res.render('v.html', { id: req.params.id });
});

app.get('/gif/:id', function (req, res) {

  function send_gif(data) {
    console.log('GIF ' + data.id + ': streaming GIF');
    res.sendfile(data.gifpath);
  }

  function clean_files(data) {
    var command = 'rm -f ' + data.tmpdir + data.id + '*.png ' + data.videopath;
    console.log('GIF ' + data.id + ': removing temporary PNGs');
    exec(command, function (error, stdout, stderr) {
      send_gif(data);
    });
  }

  function generate_gif(data) {
    var command = 'convert -colors 16 ' +  data.tmpdir + data.id + '*.png ' + data.gifpath;
    console.log('GIF ' + data.id + ': creating GIF');
    exec(command, function (error, stdout, stderr) {
      clean_files(data);
    });
  }

  function extract_thumbnails(data) {
    var command = 'ffmpeg -i ' + data.videopath + ' -r 10 ' + data.tmpdir + data.id + '%05d.png';
    console.log('GIF ' + data.id + ': creating PNGs');
    exec(command, function (error, stdout, stderr) {
      generate_gif(data);
    });
  }

  function fetch_video(data, url) {
    var file = fs.createWriteStream(data.videopath);
    console.log('GIF ' + data.id + ': downloading video');
    https.get(url, function (response) {
      response.pipe(file);
      response.on('end', function () {
        extract_thumbnails(data);
      });
    });
  }

  function get_vine_url(data) {
    console.log('GIF ' + data.id + ': fetching video URL');

    https.get('https://vine.co/v/' + data.id + '/card', function (response) {
      var url,
          chunks = [],
          file;
      response.on('data', function (chunk) {
        chunks.push(chunk);
      });

      response.on('end', function () {
        try {
          url = chunks.join('').match(/<source src="([^"]*)"/)[1];
          fetch_video(data, url);
        }
        catch (e) {
          res.redirect('/');
        }
      });
    });
  }

  function serve_gif(data) {
    fs.exists(data.gifpath, function (exists) {
      console.log('GIF ' + data.id + ': checking if we already have it');
      if (exists) {
        console.log('GIF ' + data.id + ': bingo! We have it, streaming...');
        res.sendfile(data.gifpath);
      }
      else {
        console.log('GIF ' + data.id + ': shoot.. apparently this is the first time someone wants this gif');
        get_vine_url(data);
      }
    });
  }

  var data        = {};
  data.id         = req.params.id;
  data.tmpdir     = 'tmp/';
  data.gifdir     = 'gif/';
  data.gifpath    = data.gifdir + data.id + '.gif';
  data.videopath  = data.tmpdir + data.id + '.mp4';

  serve_gif(data);
});

app.listen(4000);
