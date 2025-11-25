
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

Number.prototype.pingPong = function (min, max) {
    const offset = max - min;
    const finalValue = (this - min) / offset;
    const beforeDot = Math.floor(finalValue);
    const afterDot = finalValue - beforeDot;
    const retVal = beforeDot % 2 === 0 ? min + (offset * afterDot): max - (offset * afterDot);
    return retVal;
}

Number.prototype.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

Array.prototype.shuffle = function() {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
}

Array.prototype.distinct = function () {
    return this.filter(
        (thing, i, arr) => arr.findIndex(t => t.id === thing.id) === i
      );
}

Array.prototype.randomElement = function() {
    if (this.length <= 0) return null;
    return this[Math.floor(Math.random() * this.length)];
}

const getTokenParam = function () {
    var url_string = window.location.href;
    var url = new URL(url_string);
    if (url.searchParams.has("token")) {
        var code = url.searchParams.get("token");

        return code;
    }
    else {
        return '';
    }
}

const getAngle = (input) => {
    if (input < 0.0) return 360.0 + input % 360.0;
    if (input > 360.0) return input % 360.0;
    return input;
}

const WaitFor = function (condition, callback) {
    if (!condition()) {
        setTimeout(WaitFor.bind(null, condition, callback), 100); /* this checks the flag every 100 milliseconds*/
    } else {
        callback();
    }
}

const isMuted = () => {
	var soundSettings = JSON.parse(localStorage.getItem('mute'));
    try {
        return soundSettings["*"];
    }
    catch {
        return false;
    }
}

const setMute = (value) => {
    var v = value ? 'true' : 'false';
    window.top.postMessage('setMute:' + v, '*');
 }

export {
    getAngle,
    WaitFor,
    getTokenParam,
    isMuted,
    setMute
}