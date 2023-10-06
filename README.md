# Remote for stellarium
Based on x11remote  
  
## Installation
- get apache2 ready and put all fonts (buttonFont.tff, buttonFont.svg, buttonFont.woff, buttonFont.woff2, buttonFont.ocf) into `/var/www/html/`
- compile with cabal
- setup wifi access point, set address to 10.0.0.1, netmask to 24, and gateway to 10.0.0.4 in IPv4 setting
  
## Usage
- start wifi ap on host device
- start the remote service by `x11remote -p 9234 -w`, change the port number if necessary
- connect your remote device to the wifi ap and go to `10.0.0.1:9234`
  
Text below is from the original README file  
---   
Mouse and keyboard remote control for X11 systems implemented as a HTML5 web app for touchscreen devices.

**What you get:** A touchpad-style mouse with three buttons and a keyboard with the most frequently used
keys (a full 105-key keyboard would be not practical on a small display).

## Why?
Because every single remote control app I found was buggy or unusable.

* x11remote is simple - you just start the server and open the correct page on your smartphone or
tablet. No app installation required - plain HTML5 which should work in every modern browser.

* x11remote works on every X11 system - all you need is to have xdotool (to execute the actions) and
xmodmap (to get the current keyboard layout) installed.

* x11remote features a real keyboard - you can use modifier keys and key combinations
exactly as you would on a real keyboard. In fact, the keyboard layout which you get is based on your
actual keyboard layout on the controlled computer! For example -- you use Dvorak? Great, you get
Dvorak on the virtual keyboard, too!

## Downsides
* x11remote is not and will never be cross-platform. For other platforms there already exists a
multitude of alternatives.

* you can not use your regular touch-keyboard. If you really want this, x11remote is not the right
  fit for you. But in fact the virtual keyboard provided here is much more usable for input and
  control of a regular linux system.

## Installation and Usage
The server is written in Haskell, so to build an compile just clone this repository and issue `cabal
install`. Run `x11remote -p PORT` to run x11remote on a custom port. On your touch device just open
the website at `http://<IP-Address of host>:<selected port>`.

**Arch Linux users:** You can install x11remote from AUR!

