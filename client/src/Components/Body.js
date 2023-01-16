import React, { useEffect, useState } from 'react'
import axios from 'axios';
import '../../src/body.css';

function Body() {
    const proxy = "http://localhost:5000"

    const [albumArray, setAlbumArray] = useState([{}]);
    const [selectedAlbum, setSelectedAlbum] = useState("");
    const [lyric, setLyric] = useState({});
    const [songArray, setSongArray] = useState([{}]);
    const [selectedSong, setSelectedSong] = useState("");
    const [numCorrect, setNumCorrect] = useState(0);
    const [numAttempts, setNumAttempts] = useState(0);

    const numSongOptions = 4;


    // get list of all albums
    useEffect(() => {
        fetch('/albums').then(
            response => response.json()
        ).then(
            album => {
                setAlbumArray(album.albums)
            }
        )
    }, [])

    // if the selection of the album dropdown has changed
    async function albumChange(event) {

        // get a random lyric if the button is pressed
        if (event.target.id === 'button') {
            setLyric(getRandomLyric());
        } else {
            // otherwise change what is shown in dropdown
            setSelectedAlbum(event.target.value)
            event.preventDefault();
        }
    }

    async function songChange(event) {
        if (event.target.id === 'submitGuess') {
            submitGuess();
        } else {
            setSelectedSong(event.target.value)
            event.preventDefault();
        }
    }

    async function submitGuess() {
        // get the song where correctAnswer = true
        let correctSongObj = songArray.filter(obj => {
            return obj.correctAnswer === true
        })

        if (correctSongObj[0].song === selectedSong) {
            console.log("correct")
            setNumCorrect(numCorrect + 1);
        }
        setNumAttempts(numAttempts + 1);
    }

    async function getRandomLyric() {
        const index = albumArray.name.indexOf(`${selectedAlbum}`);

        // get a random lyric based on the musixmatchID of the selected album
        let response = await axios(proxy + `/randLyric/${(albumArray.musixmatchId[index])}`);

        setLyric(response.data);

        /*
         these are used as parameters because lyric may not have been set 
         by the time getSongList() is called
        */
        getSongList(albumArray.musixmatchId[index], response.data.song);
    }

    async function getSongList(albumID, songTitle) {
        /* get an array of objects that have a song and correctAnswer property based on how many
           options are wanted in the dropdown, the id of the album that the songs should be pulled
           from, and what the title of the song is that should have correctAnswer = true and needs
           to be included.
        */
        let response = await axios(proxy + `/songList/${numSongOptions}/${albumID}/includes/${songTitle}`)

        setSongArray(response.data);
        console.log(response.data);
    }

    return (
        <div className="wrapper">
            <div className="row">
                <div className="column">
                    <div id="album-dropdown">
                        <p><u>Select Album:</u></p>
                        <form>
                            <select className="dropdown" id="album-dropdown" value={selectedAlbum} onChange={albumChange}>
                                {(typeof albumArray.name == 'undefined') ? (
                                    <option>Loading ..</option>
                                ) : (
                                    albumArray.name.map((name, i) => (
                                        <option key={i}>{name}</option>
                                    ))
                                )}
                            </select>
                        </form>
                        <button id="button" onClick={albumChange}>Get Lyric</button>
                    </div>
                </div>
                <div className="column">
                    <div id="guess-dropdown">
                        <p><u>Select the song you think this lyric is from:</u></p>
                        <form>
                            <select className="dropdown" id="song-dropdown" value={selectedSong} onChange={songChange}>
                                {(typeof songArray[0].song == 'undefined') ? (
                                    <option>Song List Loading ..</option>
                                ) : (
                                    songArray.map((song, i) => (
                                        <option key={i}>{song.song}</option>
                                    ))
                                )}
                            </select>
                        </form>
                        <button id="submitGuess" onClick={songChange}>Submit Guess</button>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="column" id="lyric-div">
                    {(typeof lyric.lyric == 'undefined') ? (
                        <p className="lyric">Lyric Loading ..</p>
                    ) : (
                        <p className="lyric">♫ {lyric.lyric} ♫</p>
                    )}
                </div>
            </div>
            <div className="row">
                <div className="column" id="answer-div">
                    <p>Number Correct: {numCorrect}</p>
                    <p>Number of Attempts: {numAttempts}</p>
                </div>
            </div>
        </div>
    )
}

export default Body;
