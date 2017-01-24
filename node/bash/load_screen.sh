#!/bin/bash

targetFile=screencap.png

if [[ ! -z "$1" ]];then
    targetFile=$1
fi

tmpFile=/data/local/tmp/screencap.png
adb shell screencap -p $tmpFile
adb pull $tmpFile $targetFile
