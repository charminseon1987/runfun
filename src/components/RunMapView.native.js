import React, { forwardRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { C } from '../theme/season';

function RunMapView({ mapRegion, routeCoords, friendRouteCoords = [], friendCurrentPoint = null, showFriendLayer = false }, ref) {
  return (
    <MapView
      ref={ref}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFillObject}
      initialRegion={mapRegion}
      mapType="standard"
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      loadingEnabled
      loadingIndicatorColor="#d96b85"
      loadingBackgroundColor="#141018"
      moveOnMarkerPress={false}
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
      {showFriendLayer && friendRouteCoords.length >= 2 && (
        <Polyline
          coordinates={friendRouteCoords}
          strokeColor={C.accentB}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}
      {showFriendLayer && friendCurrentPoint && (
        <Marker coordinate={friendCurrentPoint} title="같이 달리는 친구" />
      )}
    </MapView>
  );
}

export default forwardRef(RunMapView);
