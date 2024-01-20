Module.register('MMM-SoundsExtended', {

    /**
     * Default Config
     */
    defaults: {
        startupSound:   null,
        defaultDelay:   10,
        quietTimeStart: null,
        quietTimeEnd:   null
    },

    /**
     * Module Start
     */
    start: function() {
        Log.info('Starting module: ' + this.name + ' ' + JSON.stringify(this.config));
        this.sendSocketNotification('CONFIG', this.config);
    },

    /**
     * Notification Received from other modules
     *
     * @param {String} notification
     * @param {*}      payload
     */
    notificationReceived: function(notification, payload) {
        if (notification === 'PLAY_SOUND') {
            this.sendSocketNotification(notification, payload);
        }
    }
});
