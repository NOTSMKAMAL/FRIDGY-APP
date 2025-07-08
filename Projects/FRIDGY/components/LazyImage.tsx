import React, { useState, memo } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';

interface LazyImageProps {
  source: { uri: string };
  style?: any;
  width?: number;
  height?: number;
}

export const LazyImage = memo(({ source, style, width = 100, height = 100 }: LazyImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[{ width, height, backgroundColor: '#E0E0E0', borderRadius: 8 }, style]}>
      {loading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      {!error && (
        <Image
          source={source}
          style={[{ width, height, borderRadius: 8 }, style]}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          resizeMode="cover"
        />
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';