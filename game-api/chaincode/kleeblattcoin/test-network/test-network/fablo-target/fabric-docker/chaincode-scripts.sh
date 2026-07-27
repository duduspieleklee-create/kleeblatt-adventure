#!/usr/bin/env bash

chaincodeList() {
  if [ "$#" -ne 2 ]; then
    echo "Expected 2 parameters for chaincode list, but got: $*"
    exit 1

  elif [ "$1" = "peer0.curator.local" ]; then

    peerChaincodeListTls "cli.curator.local" "peer0.curator.local:7041" "$2" "crypto-orderer/tlsca.orderer.local-cert.pem" # Third argument is channel name

  elif
    [ "$1" = "peer0.partner1.local" ]
  then

    peerChaincodeListTls "cli.partner1.local" "peer0.partner1.local:7061" "$2" "crypto-orderer/tlsca.orderer.local-cert.pem" # Third argument is channel name

  else

    echo "Fail to call listChaincodes. No peer or channel found. Provided peer: $1, channel: $2"
    exit 1

  fi
}

# Function to perform chaincode invoke. Accepts 5 parameters:
#   1. comma-separated peers
#   2. channel name
#   3. chaincode name
#   4. chaincode command
#   5. transient data (optional)
chaincodeInvoke() {
  if [ "$#" -ne 4 ] && [ "$#" -ne 5 ]; then
    echo "Expected 4 or 5 parameters for chaincode list, but got: $*"
    echo "Usage: fablo chaincode invoke <peer_domains_comma_separated> <channel_name> <chaincode_name> <command> [transient]"
    exit 1
  fi
  cli=""
  peer_addresses=""

  peer_certs=""

  if [[ "$1" == *"peer0.curator.local"* ]]; then
    cli="cli.curator.local"
    peer_addresses="$peer_addresses,peer0.curator.local:7041"

    peer_certs="$peer_certs,crypto/peers/peer0.curator.local/tls/ca.crt"

  fi
  if [[ "$1" == *"peer0.partner1.local"* ]]; then
    cli="cli.partner1.local"
    peer_addresses="$peer_addresses,peer0.partner1.local:7061"

    peer_certs="$peer_certs,crypto/peers/peer0.partner1.local/tls/ca.crt"

  fi
  if [ -z "$peer_addresses" ]; then
    echo "Unknown peers: $1"
    exit 1
  fi

  if [ "$2" = "localtest" ]; then
    ca_cert="crypto-orderer/tlsca.orderer.local-cert.pem"
  fi

  peerChaincodeInvokeTls "$cli" "${peer_addresses:1}" "$2" "$3" "$4" "$5" "${peer_certs:1}" "$ca_cert"

}
