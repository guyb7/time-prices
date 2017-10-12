# TimePrices
![Time Prices Screenshot](./dist/icons/icon128.png)

A Chrome extension that shows a tooltip when hovering over prices with the time that will take you to earn that amount.

## Demo
[Demo page here](https://guyb7.github.io/time-prices/index.html)

Screenshots:

![Time Prices Screenshot](./docs/time-prices-screenshot.jpg)

## How To Install
Install the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/timeprices/ghhacoaoggpnihbdoejcmpmiepkjkedh).

## Bugs & Feature Requests
Search the [issues](https://github.com/guyb7/time-prices/issues) and create a new one if it doesn't exist already.

## Development
* Clone this repo
* Open [chrome://extensions/](chrome://extensions/) in your Chrome
* Enable `Developer mode`
* Click on `Load unpacked extension...` and browse to the `dist/` directory path under the repo

At the moment there are no tests and no build. Edit the source files directly under the `dist/` directory.

## Publish
* Make sure to bump the version in `/dist/manifest.json`
* Create a zip file with the contents of the `dist/` directory
* Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
* Upload the zip package and click on Publish Changes
