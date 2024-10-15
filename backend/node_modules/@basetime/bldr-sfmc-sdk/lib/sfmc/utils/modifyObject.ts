const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const capitalizeKeys = (obj: any) => {
    let objectOut = obj;

    var key, upKey;
    for (key in objectOut) {
        if (Object.prototype.hasOwnProperty.call(objectOut, key)) {
            upKey =
                key.length > 2 ? capitalizeFirstLetter(key) : key.toUpperCase();
            if (upKey !== key) {
                objectOut[upKey] = objectOut[key];
                delete objectOut[key];
            }
            // recurse
            if (typeof objectOut[upKey] === 'object') {
                capitalizeKeys(objectOut[upKey]);
            }
        }
    }

    return objectOut;
};

const lowercaseFirstLetter = (string: string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
};

const lowercaseKeys = (obj: any) => {
    let objectOut = obj;

    var key, upKey;
    for (key in objectOut) {
        if (Object.prototype.hasOwnProperty.call(objectOut, key)) {
            upKey =
                key.length > 2 ? lowercaseFirstLetter(key) : key.toLowerCase();
            if (upKey !== key) {
                objectOut[upKey] = objectOut[key];
                delete objectOut[key];
            }
            // recurse
            if (typeof objectOut[upKey] === 'object') {
                lowercaseKeys(objectOut[upKey]);
            }
        }
    }

    return objectOut;
};

export { capitalizeKeys, lowercaseKeys };
