import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

export default function RoutingMachine({
  startCoords,
  endCoords,
  setRouteInfo,
}) {
  const map = useMap();
  const routingControlRef = useRef(null); // track the route without re-rendering

  useEffect(() => {
    if (!startCoords || !endCoords) return;

    // route doesn't exist yet, create it
    if (!routingControlRef.current) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(startCoords.lat, startCoords.lng),
          L.latLng(endCoords.lat, endCoords.lng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        showAlternatives: true,
        altLineOptions: {
          styles: [
            { color: "#9CA3AF", weight: 4, opacity: 0.7, dashArray: "10, 10" }, // Gray dashed line for slower/alternate routes
          ],
        },
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [{ color: "#10B981", weight: 6, opacity: 0.9 }], // Main shortest/fastest path (Solid Emerald)
        },
        show: false, // Keeps the text box hidden
        createMarker: () => null, // Hides default markers
      }).addTo(map);

      // Extract ETA and Distance for our custom floating UI
      routingControlRef.current.on("routesfound", function (e) {
        const summary = e.routes[0].summary; // e.routes[0] is always the shortest/fastest
        if (setRouteInfo) {
          setRouteInfo({
            distance: (summary.totalDistance / 1000).toFixed(1),
            time: Math.ceil(summary.totalTime / 60),
          });
        }
      });
    }
    // route already exists, just update the waypoints!
    else {
      routingControlRef.current.setWaypoints([
        L.latLng(startCoords.lat, startCoords.lng),
        L.latLng(endCoords.lat, endCoords.lng),
      ]);
    }

    // Cleanup when the map is closed
    return () => {
      // Only remove the control if the component is actually unmounting
      if (routingControlRef.current && !startCoords) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [
    startCoords.lat,
    startCoords.lng,
    endCoords.lat,
    endCoords.lng,
    map,
    setRouteInfo,
  ]);

  return null;
}
