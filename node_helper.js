'use strict';

const fs         = require('fs');
const path       = require('path');
const NodeHelper = require('node_helper');
const Player     = require('node-aplay');
const moment     = require('moment');
const Log        = require("logger");


module.exports = NodeHelper.create({
    isLoaded: false,
    config:   null,

    /**
     * @param {String} notification
     * @param {*}      payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === 'CONFIG') {
            if (!this.isLoaded) {
                this.config   = payload;
                this.isLoaded = true;

                if (this.config.startupSound) {
                    this.playFile(this.config.startupSound);
                }
            }
        } else if (notification === 'PLAY_SOUND') {
            if (typeof payload === 'string') {
                this.playFile(payload);
            } else if (typeof payload === 'object') {
                if (typeof payload.sound === 'undefined' || !payload.sound) {
                    Log.error('Could not play sound, notification payload `sound` was not supplied');
                } else {
                    this.playFile(payload.sound, payload.delay);
                }
            }
        }
    },

    start: function() {
		Log.info('Starting module: ' + this.name);

		// http://<host>/MMM-SoundsExtended/play_sound?sound=sonar.wav
		this.expressApp.get("/" + this.name + "/play_sound", (req, res) => {
			let sound = req.query.sound;
            let delay = req.query.delay;
            
            Log.info('sound: ' + sound + " delay:" + delay);

            this.playFile(sound, delay);

            res.send("done"); 
		});
	},

    /**
     * @param {String}  filename
     * @param {Number} [delay]  in ms
     */
    playFile: function (filename, delay) {
        // Only play if outside of quiet hours
        let play = true;

        if (this.config && this.config.quietTimeStart && this.config.quietTimeEnd) {
            Log.info('Quiet Time Start is: ' + this.config.quietTimeStart);
            Log.info('Quiet Time End is: ' + this.config.quietTimeEnd);

            let start_moment = moment(this.config.quietTimeStart, 'HH:mm');
            let end_moment   = moment(this.config.quietTimeEnd, 'HH:mm');

            Log.info('Start Moment: ' + start_moment.format('YYYY-MM-DD HH:mm'));
            Log.info('End Moment: ' + end_moment.format('YYYY-MM-DD HH:mm'));

            let time = moment();

            if (start_moment.isBefore(end_moment)) {
                if (moment().isBetween(start_moment, end_moment)) {
                    play = false;
                }
            } else {
                let day_start = moment('00:00:00', 'HH:mm:ss');
                let day_end = moment('23:59:59', 'HH:mm:ss');
                if (time.isBetween(day_start, end_moment) || time.isBetween(start_moment, day_end)) {
                    play = false;
                }
            }
        }

        if (play) {
            delay = delay || (this.config && this.config.defaultDelay) || 10;

            let soundfile = __dirname + '/sounds/' + filename;
            Log.info('soundfile: ' + soundfile);

            // Make sure file exists before playing
            try {
                fs.accessSync(soundfile, fs.F_OK);
            } catch (e) {
                // Custom sequence doesn't exist
                Log.error('Sound does not exist: ' + soundfile);
                return;
            }

            Log.info('Playing ' + filename + ' with ' + delay + 'ms delay');

            try {
                setTimeout(() => {
                    new Player(path.normalize(__dirname + '/sounds/' + filename)).play();
                }, delay);
            } catch (e) {
                // Custom sequence doesn't exist
                Log.error('Exception during playing sound: ' + e);
                return;
            }
        } else {
            Log.info('Not playing sound as quiet hours are in effect');
        }
    },
});
