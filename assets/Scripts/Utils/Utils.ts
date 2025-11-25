// asset/Utils/Utils.ts
// Provides utility methods and extends native JavaScript prototypes.

// --- 1. Extend Global Prototypes (for TypeScript recognition) ---
declare global {
    interface Number {
        clamp(min: number, max: number): number;
        pingPong(min: number, max: number): number;
        randomInt(min: number, max: number): number;
    }
    interface Array<T> {
        shuffle(): Array<T>;
        // Filters array elements based on the 'id' property.
        distinct(): Array<T>; 
        randomElement(): T | null;
    }
}

// --- 2. Implementations ---

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this.valueOf(), min), max);
};

Number.prototype.pingPong = function (min, max) {
    const offset = max - min;
    const finalValue = (this.valueOf() - min) / offset;
    const beforeDot = Math.floor(finalValue);
    const afterDot = finalValue - beforeDot;
    // Creates a smooth oscillation between min and max.
    const retVal = beforeDot % 2 === 0 ? min + (offset * afterDot) : max - (offset * afterDot);
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
    // Ensures only unique objects (based on 'id') are returned.
    return this.filter(
        (thing, i, arr) => arr.findIndex(t => t.id === thing.id) === i
      );
}

Array.prototype.randomElement = function() {
    if (this.length <= 0) return null;
    return this[Math.floor(Math.random() * this.length)];
}

// --- 3. Global Helper Functions ---

/**
 * Retrieves the 'token' parameter from the current URL query string.
 */
const getTokenParam = function (): string {
    const url_string = document.location.href;
    const url = new URL(url_string);
    if (url.searchParams.has("token")) {
        const code = url.searchParams.get("token");
        return code || '';
    }
    return '';
}

/**
 * Executes a callback once a specified condition becomes true (polling mechanism).
 */
const WaitFor = function (condition: () => boolean, callback: () => void) {
    if (!condition()) {
        setTimeout(WaitFor.bind(null, condition, callback), 100); 
    } else {
        callback();
    }
}

/**
 * Checks the local storage for the mute status.
 */
const isMuted = (): boolean => {
	const soundSettings = JSON.parse(localStorage.getItem('mute') || '{}');
    try {
        // Reads the mute setting, defaults to false if not found.
        return soundSettings["*"] === true;
    }
    catch {
        return false;
    }
}

/**
 * Sends a message to the top window to set the global mute status.
 */
const setMute = (value: boolean): void => {
    const v = value ? 'true' : 'false';
    window.top?.postMessage('setMute:' + v, '*');
 }

export {
    WaitFor,
    getTokenParam,
    isMuted,
    setMute
}