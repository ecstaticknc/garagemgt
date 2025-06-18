// components/CustomTabBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets(); // Get safe area insets for proper positioning

  return (
    <BlurView
      intensity={80} // Adjust this value (0-100) for more or less blur
      tint="light"   // 'light', 'dark', or 'default'
      style={[styles.blurContainer, { paddingBottom: insets.bottom }]} // Apply safe area padding
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Get the icon component provided in the options
          const TabBarIconComponent = options.tabBarIcon;
          let IconDisplay = null;

          if (TabBarIconComponent) {
            IconDisplay = TabBarIconComponent({
              color: isFocused ? options.tabBarActiveTintColor : options.tabBarInactiveTintColor,
              size: 24, // Standard icon size
            });
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              {IconDisplay}
              <Text style={{
                color: isFocused ? options.tabBarActiveTintColor : options.tabBarInactiveTintColor,
                fontSize: 12,
                marginTop: 4,
                fontWeight: isFocused ? '600' : 'normal',
              }}>
                {typeof label === 'string' ? label : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute', // Position above other content
    bottom: 0,
    left: 0,
    right: 0,
    // Optional: Add a subtle top border for definition, mimicking iOS
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 60, // Adjust overall tab bar height as needed
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent', // Critical: This must be transparent to show the blur
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
});

export default CustomTabBar;