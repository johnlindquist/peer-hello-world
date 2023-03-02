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

  // Create a channel1 with useRef
  const channel1 = useRef<RTCDataChannel>()
  const channel2 = useRef<RTCDataChannel>()

  useEffect(() => {
    if (!peer1.current || !peer2.current) {
      console.warn(`Peer connections not ready`)
      return
    }
    // Create a dataChannel
    channel1.current ||= peer1.current.createDataChannel("dataChannel")

    const openHandler = () => {
      setConnected(true)
    }
    // Listen for dataChannel open
    channel1.current.addEventListener("open", openHandler)

    const messageHandler = (event: MessageEvent) => {
      console.log(event.data)
    }

    const dataChannelHandler = (event: RTCDataChannelEvent) => {
      channel2.current ||= event.channel

      channel2.current.addEventListener("message", messageHandler)
    }

    peer2.current.addEventListener("datachannel", dataChannelHandler)

    return () => {
      channel1.current?.removeEventListener("open", openHandler)
      peer2.current?.removeEventListener("datachannel", dataChannelHandler)
      channel2.current?.removeEventListener("message", messageHandler)
    }
  }, [])

  // Create a sendMessage useCallback
  const sendMessage = useCallback((message: string) => {
    if (!channel1.current) {
      console.warn(`Channel not ready`)
      return
    }
    channel1.current.send(message)
  }, [])

  // Track the state of the connection
  const [connected, setConnected] = useState(false)

  // Create a useCallback to connect the peers
  const connect = useCallback(async () => {
    console.log(`Connected: ${connected}`)

    if (!peer1.current || !peer2.current) {
      console.warn(`Peer connections not ready`)
      return
    }

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

      {/* When connected, display a tailwind button to use sendMessage to send Hello World */}
      {connected && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => sendMessage("Hello World")}
        >
          Send Message
        </button>
      )}
    </div>
  )
}

export default Home
