const sumByKey = (arr: any[], key: string) => {
    const res = arr.reduce((previousValue, currentValue) => {
        return {
            [key]: previousValue[key] + currentValue[key],
        };
    });

    return res[key];
};

const concatByKey = (arr: any[], key: string) => {
    const res = arr.reduce((previousValue, currentValue) => {
        return {
            [key]: [...previousValue[key], ...currentValue[key]],
        };
    });

    return res[key];
};
export { sumByKey, concatByKey };
