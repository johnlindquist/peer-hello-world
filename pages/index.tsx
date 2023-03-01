import type { NextPage } from "next"
import { useCallback, useEffect, useRef, useState } from "react"

// Create a usePeerConnection hook
const usePeerConnection = () => {
  // Create an RTCPeerConnection with useRef
  const peerConnection = useRef<RTCPeerConnection>()

  // Wait for mount in useEffect to create the peerConnection
  useEffect(() => {
    peerConnection.current ||= new RTCPeerConnection()
  }, [])

  // Return the peerConnection
  return peerConnection
}

const Home: NextPage = () => {
  const peer1 = usePeerConnection()
  const peer2 = usePeerConnection()

  // Track the state of the connection
  const [connected, setConnected] = useState(false)

  // Create a useCallback to connect the peers
  const connect = useCallback(async () => {
    console.log(`Connected: ${connected}`)

    if (!peer1.current || !peer2.current) {
      console.warn(`Peer connections not ready`)
      return
    }

    // Create a dataChannel
    const dataChannel = peer1.current.createDataChannel("dataChannel")

    // Listen for dataChannel open
    dataChannel.addEventListener("open", () => {
      setConnected(true)
    })

    // Create an offer
    const offer = await peer1.current?.createOffer()
    await peer1.current?.setLocalDescription(offer)
    await peer2.current?.setRemoteDescription(offer)

    // Create an answer
    const answer = await peer2.current?.createAnswer()
    await peer2.current?.setLocalDescription(answer)
    await peer1.current?.setRemoteDescription(answer)

    // Listening for ICE candidates
    peer1.current?.addEventListener("icecandidate", event => {
      console.log(event)
      if (event.candidate) {
        peer2.current?.addIceCandidate(event.candidate)
      }
    })

    peer2.current?.addEventListener("icecandidate", event => {
      console.log(event)
      if (event.candidate) {
        peer1.current?.addIceCandidate(event.candidate)
      }
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      {/* A tailwind button to connect */}
      {/* Hide button when connected */}
      {!connected && (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={connect}>
          Connect
        </button>
      )}
    </div>
  )
}

export default Home
