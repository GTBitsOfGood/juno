_wait() {
    [[ $# -lt 2 ]] && { 
        echo "Usage: ${FUNCNAME} <timeout> </path/to/script>"; return 1
    }
    timeout=$(($(date +%s) + ${1}))
    until [[ $2 ]] || [[ $(date +%s) -gt $timeout ]]; do
       :
    done
    [[ $(date +%s) -gt $timeout ]] && return 1 || return 0
}

cmd='[ $(docker ps -f health=healthy -f name=juno-api-gateway -q | wc -l) -eq 1 ]'     # script that only checks health
_wait 300 $cmd                        # maximum time to wait 300s
[[ $? -eq 0 ]] && {
    wget http://$(docker port juno-api-gateway-1 3000)/docs-yaml
} || exit 1
