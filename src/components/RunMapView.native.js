import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { C } from '../theme/season';

function RunMapView({ mapRegion, routeCoords }, ref) {
  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFillObject}
      initialRegion={mapRegion}
      mapType="standard"
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {routeCoords.length >= 2 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor={C.accent}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </MapView>
  );
}

export default forwardRef(RunMapView);
