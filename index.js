const ID3Writer = require('browser-id3-writer');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const prompt = require('prompt-sync')();
const http = require('https');
const fs = require('fs');

let url = prompt('Enter the url of the video: ');

url = url.replace(' ', '');
url = url.replace('https://www.youtube.com/watch?v=', '');
url = url.replace('https://youtu.be/', '');
url = url.split('&')[0];

console.log(`Downloading video...`);
exec(`yt-dlp -o"output.m4a" -f140 "https://youtu.be/${url}"`, (err, stdout, stderr) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log(`Download complete!`);
    console.log(`Downloading thumbnail...`);

    const file = fs.createWriteStream("thumbnail.jpg");
    const request = http.get(`https://i.ytimg.com/vi/${url}/maxresdefault.jpg`, function (response) {
        response.pipe(file);

        file.on("finish", () => {
            file.close();
            console.log("Download completed!");
            console.log(`Converting file...`);
            exec('ffmpeg -i output.m4a -c:v copy -c:a libmp3lame -q:a 4 output.mp3', (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(`Conversion complete!`);
                let title = prompt('Enter the title of the music: ');
                let artist = prompt('Enter the artist of the music: ');
                let album = prompt('Enter the album of the music: ');

                let songBuffer = fs.readFileSync('output.mp3');
                let coverBuffer = fs.readFileSync('thumbnail.jpg');

                console.log(`Writing metadata...`);

                let writer = new ID3Writer(songBuffer);
                writer.setFrame('TIT2', title)
                    .setFrame('TPE1', [artist])
                    .setFrame('TALB', album)
                    .setFrame('APIC', {
                        type: 3,
                        data: coverBuffer,
                        description: 'Super picture'
                    });
                writer.addTag();
                
                console.log(`Metadata written!`);
                console.log(`Saving...`);

                let taggedSongBuffer = Buffer.from(writer.arrayBuffer);
                fs.writeFileSync(`./SpotifyMusic/${url}.mp3`, taggedSongBuffer);
                console.log(`Saved!`);

                console.log(`Cleaning up...`);

                fs.unlinkSync('./output.m4a');
                fs.unlinkSync('./output.mp3');
                fs.unlinkSync('./thumbnail.jpg');

                console.log(`Cleanup complete!`);

                console.log(`Done!`);
            });
        });
    });
});