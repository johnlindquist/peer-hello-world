import type { NextPage } from "next"
import { useEffect, useRef } from "react"

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div>Clean slate</div>
    </div>
  )
}

export default Home
