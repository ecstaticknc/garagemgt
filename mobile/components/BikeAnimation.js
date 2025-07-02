import React, { useRef, useEffect } from 'react';
import { View, Animated, Image, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const BikeAnimation = () => {
  const bikeX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(bikeX, {
        toValue: screenWidth,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/bike.png')}
        style={[styles.bike, { transform: [{ translateX: bikeX }] }]}
        resizeMode="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    justifyContent: 'flex-end',
  },
  bike: {
    width: 100,
    height: 100,
    position: 'static',
   
  },
});

export default BikeAnimation;
