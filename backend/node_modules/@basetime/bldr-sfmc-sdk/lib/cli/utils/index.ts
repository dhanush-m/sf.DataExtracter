const { v4: uuidv4 } = require('uuid');

const guid = () => uuidv4();

/**
 *
 * @param array
 * @param key
 * @returns
 */
const uniqueArrayByKey = (array: any[], key: string) => [
    ...new Map(array.map((item) => [item[key], item])).values(),
];

export { guid, uniqueArrayByKey };
