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

  const renderPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5; // Maximum number of page buttons to display

    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          onPress={() => onPageChange(1)}
          mode={currentPage === 1 ? 'contained' : 'outlined'}
          style={[styles.pageButton, currentPage === 1 && styles.activePageButton]}
          labelStyle={[styles.pageButtonLabel, currentPage === 1 && styles.activePageButtonLabel]}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(<Text key="dots-start" style={styles.dots}>...</Text>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          onPress={() => onPageChange(i)}
          mode={currentPage === i ? 'contained' : 'outlined'}
          style={[styles.pageButton, currentPage === i && styles.activePageButton]}
          labelStyle={[styles.pageButtonLabel, currentPage === i && styles.activePageButtonLabel]}
        >
          {i}
        </Button>
      );
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Text key="dots-end" style={styles.dots}>...</Text>);
      }
      pages.push(
        <Button
          key={totalPages}
          onPress={() => onPageChange(totalPages)}
          mode={currentPage === totalPages ? 'contained' : 'outlined'}
          style={[styles.pageButton, currentPage === totalPages && styles.activePageButton]}
          labelStyle={[styles.pageButtonLabel, currentPage === totalPages && styles.activePageButtonLabel]}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

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
        <Text style={currentPage === 1 ? styles.disabledNavText : styles.navText}>Prev</Text>
      </Button>

      <View style={styles.pageNumbersContainer}>
        {renderPageNumbers()}
      </View>

      <Button
        mode="outlined"
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        icon={() => <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? COLORS.lightText : COLORS.primary} />}
        style={styles.navButton}
        contentStyle={styles.navButtonContent}
        labelStyle={{flexDirection: 'row-reverse'}} // To put icon on right
      >
        <Text style={currentPage === totalPages ? styles.disabledNavText : styles.navText}>Next</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping for many pages
    justifyContent: 'center',
    flex: 1, // Take available space
    marginHorizontal: 5,
  },
  pageButton: {
    marginHorizontal: 2,
    minWidth: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  activePageButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageButtonLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activePageButtonLabel: {
    color: COLORS.card,
  },
  navButton: {
    borderRadius: 5,
    borderColor: COLORS.primary,
    borderWidth: 1,
    minWidth: 80,
  },
  navButtonContent: {
    flexDirection: 'row',
  },
  navText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  disabledNavText: {
    color: COLORS.lightText,
  },
  dots: {
    color: COLORS.lightText,
    marginHorizontal: 5,
    fontSize: 18,
  },
});

export default Pagination;