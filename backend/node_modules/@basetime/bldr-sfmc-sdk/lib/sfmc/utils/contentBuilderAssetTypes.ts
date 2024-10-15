const MappingByAssetType = (assetType: string) => {
    let out;

    switch (assetType) {
        case 'htmlemail':
            out = {
                name: 'htmlemail',
                id: 208,
            };
            break;
        case 'htmlblock':
            out = {
                id: 197,
                name: 'htmlblock',
            };
            break;
        case 'codesnippetblock':
            out = {
                id: 220,
                name: 'codesnippetblock',
            };
            break;

        default:
            out = null;
    }

    return out;
};

export { MappingByAssetType };
