// components/AnimatedTabIcon.js
import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export default function AnimatedTabIcon({ children, focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.4 : 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {children}
    </Animated.View>
  );
}
