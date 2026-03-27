import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { C, ax } from '../theme/season';

function RunMapView(_props, _ref) {
  return (
    <View style={styles.mapFull}>
      <MapPin size={32} color={ax(0.3)} />
      <Text style={styles.mapHint}>모바일 앱에서 지도를 사용할 수 있어요</Text>
    </View>
  );
}

export default forwardRef(RunMapView);

const styles = StyleSheet.create({
  mapFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.mapBg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapHint: { color: ax(0.35), fontSize: 18, fontWeight: '700' },
});
