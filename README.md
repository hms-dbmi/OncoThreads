# OncoThreads [![Build Status](https://travis-ci.org/hms-dbmi/OncoThreads.svg?branch=master)](https://travis-ci.org/hms-dbmi/OncoThreads)
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

###### Creating an electron release using Travis
Steps to create a new release of electron installers:
1. Upgrade the OncoThreads version in package.json 
2. Tag your latest commit with this version number 
    ```
    git tag -a v[VERSION_NUMBER] -m 'v[VERSION_NUMBER]' && git push origin --tags
    ```
Travis will build installers for Mac, Windows, and Linux and create a release with these files.


Example:
![OncoThreads screenshot](https://user-images.githubusercontent.com/15909854/64640272-9869a300-d3d7-11e9-8901-f23789bd9525.png)
