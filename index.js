/* Copyright 2015 Christine S. MacNeill

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by appli cable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/* -LICENSE-START-
** Copyright (c) 2015 Blackmagic Design
**
** Permission is hereby granted, free of charge, to any person or organization
** obtaining a copy of the software and accompanying documentation covered by
** this license (the "Software") to use, reproduce, display, distribute,
** execute, and transmit the Software, and to prepare derivative works of the
** Software, and to permit third-parties to whom the Software is furnished to
** do so, all subject to the following:
**
** The copyright notices in the Software and this entire statement, including
** the above license grant, this restriction and the following disclaimer,
** must be included in all copies of the Software, in whole or in part, and
** all derivative works of the Software, unless such copies or derivative
** works are solely in the form of machine-executable object code generated by
** a source language processor.
**
** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
** IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
** FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
** SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
** FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
** ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
** DEALINGS IN THE SOFTWARE.
** -LICENSE-END-
*/

'use strict';
var bindings = require('bindings');
var macadamNative = bindings('macadam');
const util = require('util');
const EventEmitter = require('events');

function Capture (deviceIndex, displayMode, pixelFormat) {
  if (arguments.length !== 3 || typeof deviceIndex !== 'number' ||
      typeof displayMode !== 'number' || typeof pixelFormat !== 'number' ) {
    this.emit('error', new Error('Capture requires three number arguments: ' +
      'index, display mode and pixel format'));
  } else {
    this.capture = new macadamNative.Capture(deviceIndex, displayMode, pixelFormat);
  }
  EventEmitter.call(this);
}

util.inherits(Capture, EventEmitter);

Capture.prototype.start = function () {
  try {
    this.capture.init();
    this.capture.doCapture(function (x) {
      this.emit('frame', x);
    }.bind(this));
  } catch (err) {
    this.emit('error', err);
  }
}

Capture.prototype.stop = function () {
  try {
    this.capture.stop();
    this.emit('done');
  } catch (err) {
    this.emit('error', err);
  }
}

function Playback (deviceIndex, displayMode, pixelFormat) {
  if (arguments.length !== 3 || typeof deviceIndex !== 'number' ||
      typeof displayMode !== 'number' || typeof pixelFormat !== 'number' ) {
    this.emit('error', new Error('Playback requires three number arguments: ' +
      'index, display mode and pixel format'));
  } else {
    this.playback = new macadamNative.Playback(deviceIndex, displayMode, pixelFormat);
  }
  this.initialised = false;
  EventEmitter.call(this);
}

util.inherits(Playback, EventEmitter);

Playback.prototype.start = function () {
  try {
    if (!this.initialised) {
      this.playback.init();
      this.initialised = true;
    }
    this.playback.doPlayback(function (x) {
      this.emit('played', x);
    }.bind(this));
  } catch (err) {
    this.emit('error', err);
  }
}

Playback.prototype.frame = function (f) {
  try {
    if (!this.initialised) {
      this.playback.init();
      this.initialised = true;
    }
    var result = this.playback.scheduleFrame(f);
    if (typeof result === 'string')
      throw new Error("Problem scheduling frame: " + result);
    else
      return result;
  } catch (err) {
    this.emit('error', err);
  }
}

Playback.prototype.stop = function () {
  try {
    this.playback.stop();
    this.emit('done');
  } catch (err) {
    this.emit('error', err);
  }
}

function bmCodeToInt (s) {
  return new Buffer(s.substring(0, 4)).readUInt32BE(0);
}

function intToBMCode(i) {
  var b = new Buffer(4).writeUInt32(i, 0);
  return b.toString();
}

var macadam = {
  /* Enum BMDDisplayMode - Video display modes */
      /* SD Modes */
  bmdModeNTSC                     : bmCodeToInt('ntsc'),
  bmdModeNTSC2398                 : bmCodeToInt('nt23'),	// 3:2 pulldown
  bmdModePAL                      : bmCodeToInt('pal '),
  bmdModeNTSCp                    : bmCodeToInt('ntsp'),
  bmdModePALp                     : bmCodeToInt('palp'),
      /* HD 1080 Modes */
  bmdModeHD1080p2398              : bmCodeToInt('23ps'),
  bmdModeHD1080p24                : bmCodeToInt('24ps'),
  bmdModeHD1080p25                : bmCodeToInt('Hp25'),
  bmdModeHD1080p2997              : bmCodeToInt('Hp29'),
  bmdModeHD1080p30                : bmCodeToInt('Hp30'),
  bmdModeHD1080i50                : bmCodeToInt('Hi50'),
  bmdModeHD1080i5994              : bmCodeToInt('Hi59'),
  bmdModeHD1080i6000              : bmCodeToInt('Hi60'),	// N.B. This _really_ is 60.00 Hz.
  bmdModeHD1080p50                : bmCodeToInt('Hp50'),
  bmdModeHD1080p5994              : bmCodeToInt('Hp59'),
  bmdModeHD1080p6000              : bmCodeToInt('Hp60'),	// N.B. This _really_ is 60.00 Hz.
      /* HD 720 Modes */
  bmdModeHD720p50                 : bmCodeToInt('hp50'),
  bmdModeHD720p5994               : bmCodeToInt('hp59'),
  bmdModeHD720p60                 : bmCodeToInt('hp60'),
      /* 2k Modes */
  bmdMode2k2398                   : bmCodeToInt('2k23'),
  bmdMode2k24                     : bmCodeToInt('2k24'),
  bmdMode2k25                     : bmCodeToInt('2k25'),
      /* DCI Modes (output only) */
  bmdMode2kDCI2398                : bmCodeToInt('2d23'),
  bmdMode2kDCI24                  : bmCodeToInt('2d24'),
  bmdMode2kDCI25                  : bmCodeToInt('2d25'),
      /* 4k Modes */
  bmdMode4K2160p2398              : bmCodeToInt('4k23'),
  bmdMode4K2160p24                : bmCodeToInt('4k24'),
  bmdMode4K2160p25                : bmCodeToInt('4k25'),
  bmdMode4K2160p2997              : bmCodeToInt('4k29'),
  bmdMode4K2160p30                : bmCodeToInt('4k30'),
  bmdMode4K2160p50                : bmCodeToInt('4k50'),
  bmdMode4K2160p5994              : bmCodeToInt('4k59'),
  bmdMode4K2160p60                : bmCodeToInt('4k60'),
      /* DCI Modes (output only) */
  bmdMode4kDCI2398                : bmCodeToInt('4d23'),
  bmdMode4kDCI24                  : bmCodeToInt('4d24'),
  bmdMode4kDCI25                  : bmCodeToInt('4d25'),
      /* Special Modes */
  bmdModeUnknown                  : bmCodeToInt('iunk'),
  /* Enum BMDFieldDominance - Video field dominance */
  bmdUnknownFieldDominance        : 0,
  bmdLowerFieldFirst              : bmCodeToInt('lowr'),
  bmdUpperFieldFirst              : bmCodeToInt('uppr'),
  bmdProgressiveFrame             : bmCodeToInt('prog'),
  bmdProgressiveSegmentedFrame    : bmCodeToInt('psf '),
  /* Enum BMDPixelFormat - Video pixel formats supported for output/input */
  bmdFormat8BitYUV                : bmCodeToInt('2vuy'),
  bmdFormat10BitYUV               : bmCodeToInt('v210'),
  bmdFormat8BitARGB               : 32,
  bmdFormat8BitBGRA               : bmCodeToInt('BGRA'),
  // Big-endian RGB 10-bit per component with SMPTE video levels (64-960). Packed as 2:10:10:10
  bmdFormat10BitRGB               : bmCodeToInt('r210'),
  // Big-endian RGB 12-bit per component with full range (0-4095). Packed as 12-bit per component
  bmdFormat12BitRGB               : bmCodeToInt('R12B'),
  // Little-endian RGB 12-bit per component with full range (0-4095). Packed as 12-bit per component
  bmdFormat12BitRGBLE             : bmCodeToInt('R12L'),
  // Little-endian 10-bit RGB with SMPTE video levels (64-940)
  bmdFormat10BitRGBXLE            : bmCodeToInt('R10l'),
  // Big-endian 10-bit RGB with SMPTE video levels (64-940)
  bmdFormat10BitRGBX              : bmCodeToInt('R10b'),
  /* Enum BMDDisplayModeFlags - Flags to describe the characteristics of an IDeckLinkDisplayMode. */
  bmdDisplayModeSupports3D        : 1 << 0,
  bmdDisplayModeColorspaceRec601  : 1 << 1,
  bmdDisplayModeColorspaceRec709  : 1 << 2,
  // Convert to and from Black Magic codes.
  intToBMCode : intToBMCode,
  bmCodeToInt : bmCodeToInt,
  // access details about the currently connected devices
  deckLinkVersion : macadamNative.deckLinkVersion,
  getFirstDevice : macadamNative.getFirstDevice,
  // Raw access to device classes
  DirectCapture : macadamNative.Capture,
  Capture : Capture,
  Playback : Playback
};

module.exports = macadam;
