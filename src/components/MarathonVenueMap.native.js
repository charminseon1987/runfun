import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

import { C } from '../theme/season';

export default function MarathonVenueMap({ region }) {
  if (!region) return null;
  return (
    <View style={styles.wrap}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        scrollEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        zoomTapEnabled={false}
        toolbarEnabled={false}
        pointerEvents="none"
        loadingEnabled
        loadingIndicatorColor="#d96b85"
        loadingBackgroundColor="#141018"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceL2,
  },
  map: { width: '100%', height: '100%' },
});
