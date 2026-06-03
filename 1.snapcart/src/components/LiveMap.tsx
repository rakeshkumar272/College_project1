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

function Recenter({ userLocation, deliveryBoyLocation }: { userLocation: ILocation | null, deliveryBoyLocation: ILocation | null }) {
    const map = useMap()
    
    useEffect(() => {
        const hasUser = userLocation && !!userLocation.latitude && userLocation.latitude !== 0 && !!userLocation.longitude && userLocation.longitude !== 0;
        const hasBoy = deliveryBoyLocation && !!deliveryBoyLocation.latitude && deliveryBoyLocation.latitude !== 0 && !!deliveryBoyLocation.longitude && deliveryBoyLocation.longitude !== 0;

        if (hasUser && hasBoy) {
            const bounds = L.latLngBounds(
                [userLocation.latitude, userLocation.longitude],
                [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
            );
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        } else if (hasBoy) {
            map.setView([deliveryBoyLocation.latitude, deliveryBoyLocation.longitude], map.getZoom(), { animate: true });
        } else if (hasUser) {
            map.setView([userLocation.latitude, userLocation.longitude], map.getZoom(), { animate: true });
        }
    }, [userLocation, deliveryBoyLocation, map])
    return null
}



function LiveMap({ userLocation, deliveryBoyLocation, height = "500px" }: Iprops) {

    const deliveryBoyIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/9561/9561688.png",
        iconSize: [45, 45],
        iconAnchor: [22.5, 45]
    })
    const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/4821/4821951.png",
        iconSize: [45, 45],
        iconAnchor: [22.5, 45]
    })

    const showUserLocation = userLocation && !!userLocation.latitude && userLocation.latitude !== 0 && !!userLocation.longitude && userLocation.longitude !== 0;
    const showDeliveryBoyLocation = deliveryBoyLocation && !!deliveryBoyLocation.latitude && deliveryBoyLocation.latitude !== 0 && !!deliveryBoyLocation.longitude && deliveryBoyLocation.longitude !== 0;

    const linePositions =
        showDeliveryBoyLocation && showUserLocation
            ? [
                [userLocation.latitude, userLocation.longitude],
                [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]

            ] : []
    const center = showDeliveryBoyLocation
        ? [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
        : showUserLocation ? [userLocation.latitude, userLocation.longitude] : [20.5937, 78.9629]; // Default center (India)


    return (
        <div className='w-full rounded-xl overflow-hidden shadow relative z-2' style={{ height }}>
            <MapContainer center={center as any} zoom={13} scrollWheelZoom={true} className="w-full h-full">
                <Recenter userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {showUserLocation && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>Delivery Address</Popup>
                    </Marker>
                )}

                {showDeliveryBoyLocation && (
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
