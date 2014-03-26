#!/bin/bash

JS=$(cat client/libs/*)
JS="$JS $(cat client/*.js | uglifyjs)"

echo $JS > bundle.js
