#!/bin/bash
set -o errexit

start() { echo travis_fold':'start:$1; echo $1; set -v; }
end() { set +v; echo travis_fold':'end:$1; echo; echo; }
die() { set +v; echo "$*" 1>&2 ; exit 1; }
retry() {
    TRIES=1
    until curl --silent --fail http://localhost:3000/ > /dev/null; do
        echo "$TRIES: not up yet"
        if (( $TRIES > 10 )); then
            # TODO: dump logs
            die "HTTP never succeeded"
        fi
        (( TRIES++ ))
        sleep 1
    done
}
npm start &
retry
killall node

