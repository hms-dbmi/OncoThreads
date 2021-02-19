# OncoThreads [![Build Status](https://travis-ci.org/hms-dbmi/OncoThreads.svg?branch=version2)](https://travis-ci.org/hms-dbmi/OncoThreads)
OncoThreads longitudinal cancer genomics visualization project.

##### Development Environment
To install OncoThreads Dependencies run

```
npm install
```

OncoThreads can be run in the browser or as an electron application using the commands
```
npm run react-start
```
and
```
npm run electron-start
```
##### Releases
Latest release: <http://oncothreads.gehlenborglab.org/>

Installers for electron application: <https://github.com/hms-dbmi/OncoThreads/releases>

##### Creating an electron release using Travis
Steps to create a new release of electron installers:
1. Upgrade the OncoThreads version in package.json 
2. Tag your latest commit with this version number 
    ```
    git tag -a v[VERSION_NUMBER] -m 'v[VERSION_NUMBER]' && git push origin --tags
    ```
Travis will build installers for Mac, Windows, and Linux and create a release with these files.

##### Updating Offline Gene ID Mapping

The file HgncEntrez.txt is used for offline gene id mapping to ensure that no API calls are send to other services while local files are used for OncoThreads. This file needs to be updated on a regular basis. Currently, this has to be done manually using this service: <https://www.genenames.org/download/custom/>. Please select all approved genes and the columns  'Approved Symbol' and 'NCBI Gene ID' and replace the file.

##### Example:
![OncoThreads screenshot](https://user-images.githubusercontent.com/15909854/64640272-9869a300-d3d7-11e9-8901-f23789bd9525.png)
