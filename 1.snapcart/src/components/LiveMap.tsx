import React, { useEffect } from 'react'
interface ILocation {
    latitude: number,
    longitude: number
}
interface Iprops {
    userLocation: ILocation | null
    deliveryBoyLocation: ILocation | null
    height?: string
}
import L, { LatLngExpression } from "leaflet"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import "leaflet/dist/leaflet.css"

function Recenter({ positions }: { positions: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (positions[0] !== 0 && positions[1] !== 0) {
            map.setView(positions, map.getZoom(), {
                animate: true
            })
        }
    }, [positions, map])
    return null
}



function LiveMap({ userLocation, deliveryBoyLocation, height = "500px" }: Iprops) {

    const deliveryBoyIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/9561/9561688.png",
        iconSize: [45, 45]
    })
    const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/4821/4821951.png",
        iconSize: [45, 45]
    })

    const showUserLocation = userLocation && userLocation.latitude !== 0 && userLocation.longitude !== 0;

    const linePositions =
        deliveryBoyLocation && showUserLocation
            ? [
                [userLocation.latitude, userLocation.longitude],
                [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]

            ] : []
    const center = deliveryBoyLocation && deliveryBoyLocation.latitude !== 0
        ? [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
        : showUserLocation ? [userLocation.latitude, userLocation.longitude] : [20.5937, 78.9629]; // Default center (India)


    return (
        <div className='w-full rounded-xl overflow-hidden shadow relative z-2' style={{ height }}>
            <MapContainer center={center as any} zoom={13} scrollWheelZoom={true} className="w-full h-full">
                <Recenter positions={center as any} />
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {showUserLocation && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>Delivery Address</Popup>
                    </Marker>
                )}

                {deliveryBoyLocation && deliveryBoyLocation.latitude !== 0 && (
                    <Marker position={[deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]} icon={deliveryBoyIcon}>
                        <Popup>Delivery Partner</Popup>
                    </Marker>
                )}
                
                {showUserLocation && <Polyline positions={linePositions as any} color='green' />}
            </MapContainer>
        </div>
    )
}

export default LiveMap
