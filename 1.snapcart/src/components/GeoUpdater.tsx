'use client'
import { getSocket } from '@/lib/socket'
import React, { useEffect } from 'react'
import axios from 'axios'

function GeoUpdater({ userId }: { userId: string }) {
  let socket = getSocket()
  socket.emit("identity", userId)
  useEffect(() => {
    if (!userId) return
    if (!navigator.geolocation) return
    const watcher = navigator.geolocation.watchPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      
      // Socket update for immediate peer-to-peer real-time (if available)
      socket.emit("update-location", {
        userId,
        latitude: lat,
        longitude: lon
      })

      // Persist to DB via API for reliable tracking (every ~5s handled by browser or manual throttle)
      try {
        await axios.post('/api/delivery/location-update', {
            deliveryBoyId: userId,
            latitude: lat,
            longitude: lon
        })
      } catch (err) {
        console.error("Failed to update location via API", err)
      }

    }, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        console.warn("[GeoUpdater] Geolocation permission denied by user.");
      } else {
        console.error(`[GeoUpdater] Geolocation error (${err.code}): ${err.message}`);
      }
    }, { enableHighAccuracy: true })
    return () => navigator.geolocation.clearWatch(watcher)

  }, [userId])
  return null
}

export default GeoUpdater
