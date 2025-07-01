import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B42F6',
  secondary: '#8A5DFE',
  accent: '#FFD700',
  background: '#F8FAFC',
  text: '#344054',
  lightText: '#667085',
  card: '#FFFFFF',
  border: '#EAECF0',
  danger: '#F04438',
  success: '#12B76A',
  warning: '#F79009',
  info: '#06AED4',
};

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // If there's only one page or no items, don't render pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.paginationContainer}>
      <Button
        mode="outlined"
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        icon={() => <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? COLORS.lightText : COLORS.primary} />}
        style={styles.navButton}
        contentStyle={styles.navButtonContent}
      >
        {/* Removed "Prev" Text */}
      </Button>

      <View style={styles.currentPageContainer}>
        <View style={styles.currentPageCircle}>
          <Text style={styles.currentPageText}>{currentPage}</Text>
        </View>
        <Text style={styles.pageOfTotalText}>of {totalPages}</Text>
      </View>

      <Button
        mode="outlined"
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        icon={() => <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? COLORS.lightText : COLORS.primary} />}
        style={styles.navButton}
        contentStyle={styles.navButtonContent}
        // labelStyle removed as no text to reverse
      >
        {/* Removed "Next" Text */}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Reverted to space-between to align arrows left/right
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it's above other content
  },
  currentPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10, // Keep some margin for spacing
  },
  currentPageCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5, // Half of width/height for a perfect circle
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  currentPageText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageOfTotalText: {
    fontSize: 14,
    color: COLORS.text,
  },
  navButton: {
    // Removed borderRadius and borderColor
    borderWidth: 0, // Set borderWidth to 0
    minWidth: 35, // Set minWidth to 35
    paddingHorizontal: 0, // Remove horizontal padding from the button itself
  },
  navButtonContent: {
    width: 20, // Set width to 20
    justifyContent: 'center', // Center the icon horizontally
  },
  // Removed navText, disabledNavText styles as no text is displayed
});

export default Pagination;