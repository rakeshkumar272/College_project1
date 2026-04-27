'use client'
import { getSocket } from '@/lib/socket'
import React, { useEffect } from 'react'

function GeoUpdater({ userId }: { userId: string }) {
  let socket = getSocket()
  socket.emit("identity", userId)
  useEffect(() => {
    if (!userId) return
    if (!navigator.geolocation) return
    const watcher = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      console.log(`[GeoUpdater] Location update: ${lat}, ${lon}`);
      socket.emit("update-location", {
        userId,
        latitude: lat,
        longitude: lon
      })
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
