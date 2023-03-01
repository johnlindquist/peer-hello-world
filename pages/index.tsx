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

  // Create a dataChannelRef to store the dataChannel
  const dataChannelRef = useRef<RTCDataChannel>()

  // Create a useCallback to connect the peers
  const connect = useCallback(async () => {
    console.log(`Connected: ${connected}`)

    if (!peer1.current || !peer2.current) {
      console.warn(`Peer connections not ready`)
      return
    }

    // Create a dataChannel
    const dataChannel = (dataChannelRef.current ||= peer1.current.createDataChannel("dataChannel"))

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

  // useEffect to listen to dataChannel messages on peer2
  useEffect(() => {
    if (!peer2.current) {
      console.warn(`Peer connections not ready`)
      return
    }

    peer2.current?.addEventListener("datachannel", event => {
      const dataChannel = event.channel
      dataChannel.addEventListener("message", event => {
        console.log(event)
      })
    })
  }, [])

  // Create a useCallback to send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!dataChannelRef.current) {
      console.warn(`Data channel not ready`)
      return
    }

    dataChannelRef.current?.send(message)
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

      {/* Show a form when connected to send a message */}
      {/* In onSubmit send the message from the input using sendMessage */}
      {connected && (
        <form
          className="w-full max-w-sm"
          onSubmit={event => {
            event.preventDefault()
            const target = event.target as typeof event.target & {
              message: { value: string }
            }

            const message = target.message.value

            sendMessage(message)
          }}
        >
          <div className="flex items-center border border-teal-500 py-2">
            <input
              className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
              type="text"
              placeholder="Send a message"
              aria-label="Full name"
            />
            <button
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-700 border-blue-500 hover:border-blue-700 text-sm border-4 text-white py-1 px-2 rounded"
              type="button"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Home
