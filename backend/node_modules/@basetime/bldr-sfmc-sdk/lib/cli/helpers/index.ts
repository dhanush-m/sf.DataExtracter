export class Helpers {
    /**
     *
     * @param response
     * @param responseProperty
     * @param mapKey
     * @returns
     */
    formatPromiseAllResponse = (
        response: any[],
        responseProperty: string,
        mapKey: string
    ) => {
        if (!response) {
            throw new Error('Response Required');
        }

        if (!response.length) {
            throw new Error('Response must be an array');
        }

        if (!responseProperty) {
            throw new Error('Response Property Required');
        }

        if (!mapKey) {
            throw new Error('MapKey Required');
        }

        const initialFlatMap =
            response &&
            response
                .map(
                    (res) =>
                        Object.prototype.hasOwnProperty.call(
                            res,
                            responseProperty
                        ) &&
                        Array.isArray(res[responseProperty]) &&
                        res[responseProperty].length && [
                            ...res[responseProperty],
                        ]
                )
                .flat();

        const uniqueMappedResponse = initialFlatMap &&
            initialFlatMap.length && [
                ...new Map(
                    initialFlatMap.map((item) => [item[mapKey], item])
                ).values(),
            ];

        return uniqueMappedResponse || [];
    };
}
