/*globals YT*/
import YouTubePlayer from 'youtube-player';
import reqwest from 'reqwest';
import {isMobile} from './detect';
import Tracker from './tracking';
import {scrollTo} from './dom';
import {parse} from 'iso8601-duration';

class PimpedYouTubePlayer {
    play (seconds) {
        const self = this;

        self.tracker.track('play');

        if (! isMobile()) {
            self.el.querySelector('.docs__poster--wrapper').classList.add('docs__poster--wrapper--playing');
        }

        scrollTo(document.body, 0, 300);
        self.el.querySelector('.docs__poster--loader').classList.add('docs__poster--hide');

        if (seconds !== undefined) {
            self.player.seekTo(seconds, true);
        }

        self.player.playVideo();
    }

    pause () {
        const self = this;

        self.player.pauseVideo();
    }

    seekTo (seconds) {
        const self = this;

        self.play(seconds);
    }

    constructor(videoId, node, height, width, config) {
        // declare `self` to avoid scoping issues of `this`
        const self = this;

        self.el = node;

        self.tracker = new Tracker({
            videoId: videoId,
            gaTrackers: config.googleAnalytics.trackers
        });

        const playerEl = self.el.querySelector('#ytGuPlayer');

        self.player = new YouTubePlayer(playerEl, {
            height: height,
            width: width,
            videoId: videoId,
            playerVars: { 'autoplay': 0, 'controls': 1, 'rel': 0 }
        });

        self.player.on('ready', () => {
            self.player.getDuration().then(duration => self.videoDuration = duration);
        });

        self.player.on('stateChange', event => {
            let playTimer;
            if (event.data === YT.PlayerState.PLAYING) {
                playTimer = setInterval(function() {
                    self.player.getCurrentTime().then(currentTime => {
                        sendPercentageCompleteEvents(currentTime);
                    });
                }, 1000);
            } else {
                clearTimeout(playTimer);
            }
        });

        function sendPercentageCompleteEvents(currentTime) {
            const quartile = self.videoDuration / 4;

            const playbackEvents = {
                '25': quartile,
                '50': quartile * 2,
                '75': quartile * 3,
                'end': self.videoDuration
            };

            for (let prop in playbackEvents) {
                if (currentTime >= playbackEvents[prop]) {
                    self.tracker.track(prop);
                }
            }
        }

    }
}

function getYouTubeVideoDuration(videoId, callback){
    //Note: This is a browser key intended to be exposed on the client-side.
    const apiKey = 'AIzaSyCtM2CJsgRhfXVj_HesBIs540tzD4JUXqc';

    reqwest({
        url: 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' + videoId + '&key=' + apiKey,
        type: 'json',
        crossOrigin: true,
        success: (resp) => {
            //duration is an ISO8601 duration
            //see: https://developers.google.com/youtube/v3/docs/videos#contentDetails.duration
            const duration =  resp.items[0].contentDetails.duration;

            const parsedDuration = parse(duration);

            const paddedSeconds = `${parsedDuration.seconds < 10 ? '0' : ''}${parsedDuration.seconds}`;

            //assumes video duration is less than an hour
            const formattedDuration = `${parsedDuration.minutes}:${paddedSeconds}`;

            callback(formattedDuration);
        }
    });
}
export { PimpedYouTubePlayer, getYouTubeVideoDuration };
