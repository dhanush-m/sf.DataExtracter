# bldr-sdk

SDK for core BLDR functionality

# Install

# Initiate

## Reference package

```
const bldrSDK = require('@basetime/bldr-sfmc-sdk')

// OR

Import { bldrSDK } from '@basetime/bldr-sfmc-sdk'
```

## Setup Client

```
const authObject = {
  client_id: 'xxxxxxxxxx',
  client_secret: 'xxxxxxxxxx',
  auth_url: 'https://xxxxxxxxxx-xxxxxxxxx.auth.marketingcloudapis.com/',
  account_id: 'xxxxxxxxx'
}

const bldr = new bldrSDK(authObject)
const { sfmc } = bldr
```

# Usage

## Folders

Folder functionality is based on the [DataFolder](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/datafolder.html) SOAP API object unless otherwise documented.

### search

     const request = await sfmc.folder.search({
         contentType: 'asset',
         searchKey: 'Name',
         searchTerm: 'bldr-sfmc'
     })

### getFolder

    const request = await sfmc.folder.getFolder({
        contentType: 'asset',
        categoryId: 3134
    })

### getSubfolders

    const request = await sfmc.folder.getSubfolders({
        contentType: 'dataextension',
        parentId: 3134
    })

### createFolder

     const request = await sfmc.folder.createFolder({
         contentType: 'dataextension';
         name: 'new bldr folder';
         parentId: 3134;
     })

### \_updateAllowChildren

     const request = await sfmc.folder._updateAllowChildren({
         contentType: 'dataextension';
         categoryId: 3134;
     });

## Content Builder

### getByAssetId

    const request = await sfmc.asset.getByAssetId(8272);

### getAssetByLegacyId

    const request = await sfmc.asset.getAssetByLegacyId(8272);

### getAssetsByFolderArray

    const request = await sfmc.asset.getAssetsByFolderArray([3134, 8373, 8727]);

### getAssetByNameAndFolder

    const request = await sfmc.asset.getAssetByNameAndFolder({
         assetName: 'bldr_api';
         assetFolderName: 'ssjs_functions';
     });

### searchAsset

    const request = await sfmc.asset.searchAsset({
         searchKey: 'name';
         searchTerm: 'bldr_api';
     });

### postAsset

    const request = await sfmc.asset.postAsset({
        "name": "Asset Name",
        "data": {
                    "email": {
                        "options": {
                            "characterEncoding": "utf-8"
                        }
                    }
                },
        "views": {
            "html": {
                "content": "<!DOCTYPE html>.....</html>"
            }
        },
        "text": {},
        "subjectline": {
        	"content": "%%First_Name%% this is my subject line"
        },
        "preheader": {
        	"content": "updated the preheader too!"
        },
        "assetType": {
            "name": "htmlemail",
            "id": 208
        }
    })

### putAsset

    const request = await sfmc.asset.putAsset({
        "name": "Asset Name",
        "data": {
                    "email": {
                        "options": {
                            "characterEncoding": "utf-8"
                        }
                    }
                },
        "views": {
            "html": {
                "content": "<!DOCTYPE html>.....</html>"
            }
        },
        "text": {},
        "subjectline": {
        	"content": "%%First_Name%% this is my subject line"
        },
        "preheader": {
        	"content": "updated the preheader too!"
        },
        "assetType": {
            "name": "htmlemail",
            "id": 208
        }
    })

### getImageData

    const request = await sfmc.asset.getImageData(3837)
