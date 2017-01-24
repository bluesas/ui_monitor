#!/bin/bash

targetFile=./viewtree.xml

if [[ ! -z $1 ]]; then
    echo "\$1 is $1"
    targetFile=$1
fi

tmpFile=/data/local/tmp/uidump.xml 
echo $targetFile
adb shell uiautomator dump $tmpFile
adb pull $tmpFile $targetFile
