import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';

const BikeAnimation = () => {
  const wheelSpin = useRef(new Animated.Value(0)).current;
  const bikeX = useRef(new Animated.Value(0)).current; // ✅ use single Value

  // ♻️ Wheel Rotation (Loop)
  useEffect(() => {
    Animated.loop(
      Animated.timing(wheelSpin, {
        toValue: 5,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = wheelSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 🚴‍♂️ Move bike left → right → back
  const moveBike = () => {
    Animated.sequence([
      Animated.timing(bikeX, {
        toValue: 250,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(bikeX, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 👆 PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 80;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          moveBike();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={moveBike} activeOpacity={1} style={{ width: '170%' }}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[{ transform: [{ translateX: bikeX }] }]} // ✅ only translateX
        >
          {/* 🏍️ Bike Body */}
          <Image
            source={require('../assets/bike.png')}
            style={styles.bike}
            resizeMode="contain"
          />

          {/* 🔘 Front Wheel */}
          <Animated.Image
            source={require('../assets/back.png')}
            style={[styles.wheel, styles.frontWheel, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />

          {/* 🔘 Rear Wheel */}
          <Animated.Image
            source={require('../assets/back.png')}
            style={[styles.wheel, styles.rearWheel, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bike: {
    width: 200,
    height: 120,
    position: 'relative',
  },
  wheel: {
    width: 50,
    height: 50,
    position: 'absolute',
  },
  frontWheel: {
    bottom: -10,
    left: 140,
  },
  rearWheel: {
    bottom: -10,
    left: 22,
  },
});

export default BikeAnimation;
