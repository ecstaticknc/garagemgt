import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export default function AnimatedTabIcon({ children, focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ 
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
      alignItems: 'center'
    }}>
      {children}
    </Animated.View>
  );
}