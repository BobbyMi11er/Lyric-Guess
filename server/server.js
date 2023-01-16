const express = require('express');
const app = express();
const request = require('request');
const port = 5000;
const API_KEY = 'a391b64829be40d2a8ed164d2335143f';
const API_URL = "http://api.musixmatch.com/ws/1.1/";
const music = require('musicmatch')({ apikey: `${API_KEY}` });
const cors = require('cors');
app.use(cors());

const taylorArtistID = 259675;

function getUniqueAlbums(artist_id_num) {
  return new Promise((resolve, reject) => {
    let album_list;
    music.artistAlbums({ artist_id: artist_id_num })
      .then(function (data) {
        album_list = data.message.body.album_list;
        const albumNames = { "name": [], "musixmatchId": [] };
        for (let i = 0; i < album_list.length; i++) {
          albumNames.name.push(
            album_list[i].album.album_name);
          albumNames.musixmatchId.push(
            album_list[i].album.album_id);
        }
        resolve(albumNames);
      }).catch(function (err) {
        console.log(err);
        reject(err);
      })
  })
}

// return a random lyric and the song name that the lyric is from based on a provided album
app.get('/randLyric/:albumID', (req, res) => {
  const albumID = req.params.albumID;

  // the musicmatch package was returning empty so this is manually making the API call
  const trackListUrl = `${API_URL}album.tracks.get?apikey=${API_KEY}&album_id=${albumID}`;

  request(trackListUrl,
    (err, response) => {
      jSONResponseTracks = JSON.parse(response.body);

      if (!err && response && jSONResponseTracks.message.body.track_list) {
        let trackList = jSONResponseTracks.message.body.track_list;

        // Get a random song to choose a lyric from
        let randomTrack = getRandomElement(trackList);

        // get a random lyric from randomTrack
        const lyricUrl = `${API_URL}track.lyrics.get?apikey=${API_KEY}&track_id=${randomTrack.track.track_id}`;

        request(lyricUrl,
          (err, response) => {
            if (!err && response && response.body) {
              jSOnReponseLyrics = JSON.parse(response.body);

              const lyricsString = jSOnReponseLyrics.message.body.lyrics.lyrics_body;

              // turn the string of lyrics into segments based on newline tags
              const lyricsArray = lyricsString.split("\n");
              let lyricsArrayCleaned = [];

              for (let i = 0; i < lyricsArray.length; i++) {
                let lyric = lyricsArray[i];
                let char = lyric.charAt(0);
                // make sure that lyric isn't a blank line, starts with a letter, and is more than one word
                if (lyric.length > 0 && char.toLowerCase() !== char.toUpperCase() && lyric.includes(" ")) {
                  lyricsArrayCleaned.push(lyric);
                }
              }

              // get a random element from lyricsArrayCleaned
              let randLyric = getRandomElement(lyricsArrayCleaned);

              res.json({ "lyric": randLyric, "song": randomTrack.track.track_name, "albumID" : albumID});
            } else {
              console.log(err);
              res.send(err);
            }
          });
      } else {
        console.log(err);
        res.send(err);
      }
    });
})

// return list of random t-swift songs from a certain album that includes a proided song name
app.get('/songList/:length/:albumID/includes/:songName', (req, res) => {
  const albumID = req.params.albumID;
  const length = req.params.length;
  const reqSongName = req.params.songName;

  // the musicmatch package was returning empty so this is manually making the API call
  const trackListUrl = `${API_URL}album.tracks.get?apikey=${API_KEY}&album_id=${albumID}&page_size=8`;

  request(trackListUrl,
    (err, response) => {
      jSONResponse = JSON.parse(response.body);

      if (!err && response && jSONResponse.message.body.track_list) {
        let trackList = jSONResponse.message.body.track_list;

        // make sure that the album has enough songs to create the list
        let returnLen;
        if (length > trackList.length) {
          returnLen = trackList.length;
        } else {
          returnLen = length;
        }
        /* 
        remove the song that is correct from the options that could be chosen; 
        this prevents it from being in the final dropdown twice
        */
        trackList.splice(trackList.indexOf(reqSongName), 1)
        
        let returnSongList = [reqSongName];
        for (let i = 0; i < returnLen; i ++) {
          if (trackList !== 'undefined') {
            let randomSong = getRandomElement(trackList)
            /* some songs are listed twice in the tracklist returned from musixmatch.
              this  makes sure duplicates don't show up
            */ 
            if (randomSong.track.track_name != reqSongName) {
              returnSongList.push(randomSong.track.track_name);
              trackList.splice(trackList.indexOf(randomSong), 1);
            } else {
              i --;
            }
          }
          else {
            break;
          }
        }
        
        // shuffle returnSongList to randomize order in dropdown
        shuffleArray(returnSongList);

        /* songData is what is actually returned
           it is an array of objects that each have a song title
           and a boolean saying whether they are the song
           that was passed in with the query
        */
        let songData = []

        for (let i = 0; i < returnSongList.length; i ++) {
          let songTitle = returnSongList[i];
          let correctAnswer = (songTitle == reqSongName);

          var obj = {
            "song" : songTitle,
            "correctAnswer" : correctAnswer
          }
          songData.push(obj);
        }

        res.json(songData);

      } else {
        console.log(err);
        res.send(err);
      }
    });

})

app.get('/albums', async (req, res) => {
  let uniqueAlbums = await getUniqueAlbums(taylorArtistID);
  res.status(200).send({
    "albums": uniqueAlbums
  })
})

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// code from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

app.listen(port, () => console.log(`Server started on port ${port}`));

