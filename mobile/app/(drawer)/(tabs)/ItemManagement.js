import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import UserRoutes from '../../../backend/UserRoutes';
import { Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ItemManagement = () => {
  const db = useSQLiteContext();
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAddItemExpanded, setIsAddItemExpanded] = useState(true);

  // New state to manage expansion of each category
  const [expandedCategories, setExpandedCategories] = useState({});

  const unitOptions = ['किलो', 'ग्राम', 'नग', 'डब्बी', 'लिटर', 'पेंडी', 'डझन'];
  const itemCategoryOptions = ['किराणा', 'भाजीपाला', 'डेअरी उत्पादने', 'इतर'];

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 0, // Quantity is not used in this component, but keeping it for consistency
    unit: unitOptions[0] || '',
    category: itemCategoryOptions[0] || '',
  });

  const [editingId, setEditingId] = useState(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    fetchItemsFromDB();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItemsFromDB();
    }, [])
  );

  // --- Helper to group items by category ---
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  // --- Toggle category expansion ---
  const toggleCategoryExpansion = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const fetchItemsFromDB = async () => {
    try {
      const result = await UserRoutes.getIngredientItems(db);
      setItems(result);
      setSelectedItems([]);
      //console.log('result itmes', result);
      // Initialize all categories as expanded by default when items are fetched
      const initialExpanded = {};
      itemCategoryOptions.forEach((cat) => {
        initialExpanded[cat] = true;
      });
      setExpandedCategories(initialExpanded);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const addItem = async () => {
    if (newItem.name.trim() === '') {
      Alert.alert('त्रुटी', 'सामग्रीचे नाव रिकामे असू शकत नाही.');
      return;
    }
    if (!newItem.category || newItem.category.trim() === '') {
      Alert.alert('त्रुटी', 'कृपया श्रेणी निवडा.');
      return;
    }
    if (!newItem.unit || newItem.unit.trim() === '') {
      Alert.alert('त्रुटी', 'कृपया युनिट निवडा.');
      return;
    }

    const isDuplicate = items.some((item) => item.name === newItem.name);
    if (isDuplicate) {
      Alert.alert('सूचना', 'हे सामग्री आधीच यादीत आहे!');
      return;
    }

    try {
      let i = 0;
      await UserRoutes.saveIngredientItem(db, { ...newItem, quantity: 0 });
      setNewItem({
        name: '',
        quantity: 0,
        unit: unitOptions[0] || '',
        category: itemCategoryOptions[0] || '',
        sortOrder: i++,
      });
      fetchItemsFromDB();
      // Ensure the category of the newly added item is expanded
      setExpandedCategories((prev) => ({ ...prev, [newItem.category]: true }));
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('त्रुटी', 'सामग्री जोडताना त्रुटी आली.');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingId) return;
    if (newItem.name.trim() === '') {
      Alert.alert('त्रुटी', 'सामग्रीचे नाव रिकामे असू शकत नाही.');
      return;
    }
    if (!newItem.category || newItem.category.trim() === '') {
      Alert.alert('त्रुटी', 'कृपया श्रेणी निवडा.');
      return;
    }
    if (!newItem.unit || newItem.unit.trim() === '') {
      Alert.alert('त्रुटी', 'कृपया युनिट निवडा.');
      return;
    }

    const updatedItem = { ...newItem, itemId: editingId, quantity: 0 };

    try {
      await UserRoutes.updateIngredientItem(db, updatedItem);
      // We don't need to manually update `items` state here
      // because `fetchItemsFromDB` is called after successful update.
      // Reset newItem to its default valid state after updating
      setNewItem({
        name: '',
        quantity: 0,
        unit: unitOptions[0] || '',
        category: itemCategoryOptions[0] || '',
      });
      setEditingId(null);
      fetchItemsFromDB(); // Re-fetch to ensure data consistency and grouping
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('त्रुटी', 'सामग्री अपडेट करताना त्रुटी आली.');
    }
  };

  const startEditing = (item) => {
    setEditingId(item.itemId);
    setNewItem({
      name: item.name,
      quantity: 0,
      unit: unitOptions.includes(item.unit) ? item.unit : unitOptions[0] || '',
      category: itemCategoryOptions.includes(item.category)
        ? item.category
        : itemCategoryOptions[0] || '',
    });
    setIsAddItemExpanded(true); // Expand the "Add/Edit" section when starting to edit
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({
      name: '',
      quantity: 0,
      unit: unitOptions[0] || '',
      category: itemCategoryOptions[0] || '',
    });
  };

  const handleImportJSON = async () => {
    try {
      setIsImporting(true);
      setImportStatus('Selecting JSON file...');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        await processJSONFile(fileUri);
      } else {
        setImportStatus('File selection cancelled');
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick JSON file');
      setImportStatus('Failed to pick file');
    } finally {
      setIsImporting(false);
    }
  };

  const processJSONFile = async (uri) => {
    try {
      setImportStatus('Reading JSON file...');
      const fileContent = await FileSystem.readAsStringAsync(uri);
      const jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData)) {
        throw new Error('JSON file should contain an array of items');
      }

      const validItems = jsonData
        .map((item) => ({
          name: item.name || item.Name || item.ITEM || '',
          quantity: Number(item.quantity) || Number(item.Quantity) || Number(item.QTY) || 0,
          unit: unitOptions.includes(item.unit)
            ? item.unit || item.Unit || item.UNIT || unitOptions[0]
            : unitOptions[0],
          category: itemCategoryOptions.includes(item.category)
            ? item.category || item.Category || item.CATEGORY || itemCategoryOptions[0]
            : itemCategoryOptions[0],
        }))
        .filter(
          (item) =>
            item.name.trim() !== '' && item.category.trim() !== '' && item.unit.trim() !== ''
        );

      if (validItems.length === 0) {
        Alert.alert(
          'Error',
          'No valid items found in the JSON file (missing name, unit, or category).'
        );
        return;
      }

      await saveImportedItems(validItems);
    } catch (error) {
      console.error('Error processing JSON:', error);
      Alert.alert('Error', 'Invalid JSON format or file structure');
      setImportStatus('Failed to process JSON');
    }
  };

  const saveImportedItems = async (itemsToImport) => {
    try {
      setImportStatus('Checking for duplicates...');

      const existingNames = items.map((item) => item.name);
      const newItems = itemsToImport
        .filter((item) => !existingNames.includes(item.name))
        .map((item, index) => ({ ...item, sortOrder: index }));

      if (newItems.length === 0) {
        Alert.alert('माहिती', 'फाइलमधील सर्व सामग्री आधीच अस्तित्वात आहे.');
        return;
      }

      setImportStatus(`Importing ${newItems.length} items...`);
      console.log('newItems', newItems);
      for (const [index, item] of newItems.entries()) {
        await UserRoutes.saveIngredientItem(db, item);
        setImportStatus(`Importing item ${index + 1} of ${newItems.length}...`);
      }

      Alert.alert('यशस्वी', `यशस्वीरित्या ${newItems.length} सामग्री इम्पोर्ट केली.`);
      fetchItemsFromDB();
      setImportModalVisible(false);
    } catch (error) {
      console.error('Error saving items:', error);
      Alert.alert('त्रुटी', 'इम्पोर्ट केलेली सामग्री जतन करण्यात त्रुटी आली.');
    } finally {
      setImportStatus('');
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prevSelected) => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter((id) => id !== itemId);
      } else {
        return [...prevSelected, itemId];
      }
    });
  };

  const selectAllItems = () => {
    // Collect all item IDs from the `groupedItems` structure
    const allItemIds = Object.values(groupedItems)
      .flat()
      .map((item) => item.itemId);

    if (selectedItems.length === allItemIds.length && allItemIds.length > 0) {
      setSelectedItems([]); // Deselect all if all are already selected
    } else {
      setSelectedItems(allItemIds); // Select all
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      Alert.alert('सूचना', 'कृपया हटवण्यासाठी किमान एक सामग्री निवडा.');
      return;
    }

    Alert.alert(
      'खात्री करा',
      `तुम्हाला निवडलेल्या ${selectedItems.length} सामग्री हटवायच्या आहेत का?`,
      [
        {
          text: 'नाही',
          style: 'cancel',
        },
        {
          text: 'होय',
          onPress: async () => {
            try {
              await UserRoutes.deleteIngredientItems(db, selectedItems);
              Alert.alert('यशस्वी', 'निवडलेली सामग्री यशस्वीरित्या हटवली.');
              fetchItemsFromDB();
              setSelectedItems([]);
            } catch (error) {
              console.error('Error deleting selected items:', error);
              Alert.alert('त्रुटी', 'निवडलेली सामग्री हटवताना त्रुटी आली.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteAll = () => {
    if (items.length === 0) {
      Alert.alert('सूचना', 'हटवण्यासाठी कोणतीही सामग्री नाहीये.');
      return;
    }

    Alert.alert(
      'खात्री करा',
      'तुम्हाला खरंच सर्व सामग्री हटवायच्या आहेत का? ही क्रिया पूर्ववत करता येणार नाही.',
      [
        {
          text: 'नाही',
          style: 'cancel',
        },
        {
          text: 'होय',
          onPress: async () => {
            try {
              await UserRoutes.deleteAllIngredientItems(db);
              Alert.alert('यशस्वी', 'सर्व सामग्री यशस्वीरित्या हटवली.');
              fetchItemsFromDB();
              setSelectedItems([]);
            } catch (error) {
              console.error('Error deleting all items:', error);
              Alert.alert('त्रुटी', 'सर्व सामग्री हटवताना त्रुटी आली.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // --- Render individual item within a category list ---
  const renderItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <Checkbox
        status={selectedItems.includes(item.itemId) ? 'checked' : 'unchecked'}
        onPress={() => toggleItemSelection(item.itemId)}
        color="#3498db"
      />
      <Text style={[styles.itemText, styles.itemIndex]}>{index + 1}.</Text>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemTextSmall}>{item.unit}</Text>
      <TouchableOpacity onPress={() => startEditing(item)} disabled={isImporting}>
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.importToggleButton}
          onPress={() => setImportModalVisible(true)}
          disabled={isImporting}>
          <Text style={styles.importToggleButtonText}>इम्पोर्ट सामग्री</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Add Item Container Header */}
      <View style={styles.collapsibleHeader}>
        <Text style={styles.collapsibleTitle}>सामग्री जोडा / सुधारित करा</Text>
        <TouchableOpacity onPress={() => setIsAddItemExpanded(!isAddItemExpanded)}>
          <Ionicons
            name={isAddItemExpanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
            size={28}
            color="#3498db"
          />
        </TouchableOpacity>
      </View>

      {isAddItemExpanded && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.input}
            placeholder="सामग्रीचे नाव (उदा. साखर, तेल...)"
            value={newItem.name}
            onChangeText={(text) => {
              const marathiRegex = /^[\s\u0900-\u097F]*$/;
              if (marathiRegex.test(text)) {
                setNewItem({ ...newItem, name: text });
              }
            }}
            editable={!isImporting}
          />

          <View style={styles.pickerContainer}>
            <Picker
              style={styles.picker}
              selectedValue={newItem.category}
              onValueChange={(itemValue) => setNewItem({ ...newItem, category: itemValue })}
              enabled={!isImporting}>
              {itemCategoryOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              style={styles.picker}
              selectedValue={newItem.unit}
              onValueChange={(itemValue) => setNewItem({ ...newItem, unit: itemValue })}
              enabled={!isImporting}>
              {unitOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            onPress={editingId ? handleUpdateItem : addItem}
            style={styles.button}
            disabled={isImporting}>
            <Text style={styles.buttonText}>
              {editingId ? 'सामग्री सुधारित करा' : 'सामग्री ऍड करा'}
            </Text>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity onPress={cancelEditing} disabled={isImporting}>
              <Text style={styles.cancelButton}>कॅन्सल</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Buttons for Delete/Select All */}
      <View style={styles.deleteActionsContainer}>
        <TouchableOpacity
          style={[styles.deleteButton, selectedItems.length === 0 && styles.deleteButtonDisabled]}
          onPress={handleDeleteSelected}
          disabled={selectedItems.length === 0 || isImporting}>
          <Text style={styles.deleteButtonText}>
            निवडलेली सामग्री हटवा ({selectedItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            styles.deleteAllButton,
            items.length === 0 && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAll}
          disabled={items.length === 0 || isImporting}>
          <Text style={styles.deleteButtonText}>सर्व सामग्री हटवा</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectAllButton, items.length === 0 && styles.deleteButtonDisabled]}
          onPress={selectAllItems}
          disabled={items.length === 0 || isImporting}>
          <Text style={styles.selectAllButtonText}>
            {selectedItems.length === items.length && items.length > 0
              ? 'निवड रद्द करा'
              : 'सर्व निवडा'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display Grouped Items */}
      <FlatList
        data={Object.keys(groupedItems)} // Data is now the array of category names
        keyExtractor={(category) => category}
        renderItem={(
          { item: category } // 'item' here is the category name
        ) => (
          <View style={styles.categoryGroup}>
            <TouchableOpacity
              onPress={() => toggleCategoryExpansion(category)}
              style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {category} ({groupedItems[category].length})
              </Text>
              <Ionicons
                name={
                  expandedCategories[category]
                    ? 'chevron-up-circle-outline'
                    : 'chevron-down-circle-outline'
                }
                size={24}
                color="#2c3e50"
              />
            </TouchableOpacity>

            {expandedCategories[category] && ( // Conditionally render items for this category
              <FlatList
                data={groupedItems[category]}
                keyExtractor={(item) => item.itemId.toString()}
                renderItem={renderItem} // Use the existing renderItem for individual items
                scrollEnabled={false} // Disable inner FlatList scrolling
              />
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.noItemsText}>
            सध्या कोणतीही सामग्री उपलब्ध नाही. कृपया नवीन सामग्री जोडा किंवा इम्पोर्ट करा.
          </Text>
        )}
      />

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImportModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Items from JSON</Text>

            {importStatus ? (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{importStatus}</Text>
                {isImporting && <ActivityIndicator size="small" color="#3498db" />}
              </View>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Select a JSON file containing your items. Each item should have 'name', 'unit',
                  and 'category'. Quantity is optional and defaults to 0.
                </Text>
                <Text style={styles.codeExample}>
                  {`[\n  {"name": "आळू", "unit": "किलो", "category": "भाजीपाला"},\n  {"name": "साखर", "unit": "किलो", "category": "किराणा"},\n  ...\n]`}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isImporting ? '#95a5a6' : '#27ae60' }]}
              onPress={handleImportJSON}
              disabled={isImporting}>
              <Text style={styles.modalButtonText}>
                {isImporting ? 'Importing...' : 'Select JSON File'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setImportModalVisible(false);
                setImportStatus('');
              }}
              disabled={isImporting}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      {isImporting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>{importStatus}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  importToggleButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 5,
  },
  importToggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // New styles for collapsible "Add Item" header
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  collapsibleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addItemContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
    height: 48,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  picker: {
    height: 48,
    width: '100%',
  },
  // Styles for the category group and header
  categoryGroup: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ecf0f1', // Light grey for category header
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  itemContainer: {
    flexDirection: 'row', // Arrange children horizontally
    justifyContent: 'space-between', // Space out children evenly
    alignItems: 'center', // Align children vertically in the center
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    // Removed marginBottom as items are now grouped within categories
  },
  itemText: {
    flex: 1, // Allows text to take available space
    fontSize: 16,
    color: '#34495e',
    marginRight: 5, // Keep a small margin for spacing between text elements
    textAlignVertical: 'center', // Ensures text aligns vertically
  },
  itemIndex: {
    // Specific styles for the index number if needed, e.g., to make it less flexible
    flex: 0, // Don't let it expand
    width: 30, // Give it a fixed width for consistent spacing
    marginRight: 5,
  },
  itemTextSmall: {
    fontSize: 14,
    color: '#555',
    marginRight: 5,
    textAlignVertical: 'center', // Ensures text aligns vertically
  },
  checkbox: {
    marginRight: 0,
    marginLeft: -8,
  },
  editButton: {
    color: '#3498db',
    padding: 8,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#eee',
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  deleteActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10, // Added gap for better spacing
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    // marginHorizontal: 5, // Replaced by gap
    alignItems: 'center',
    minWidth: '30%', // Ensure buttons don't get too small on wrap
  },
  deleteAllButton: {
    backgroundColor: '#c0392b',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  selectAllButton: {
    backgroundColor: '#f39c12',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    // marginHorizontal: 5, // Replaced by gap
    alignItems: 'center',
    minWidth: '30%',
  },
  selectAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#34495e',
  },
  codeExample: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginVertical: 10,
    fontFamily: 'monospace',
    alignSelf: 'stretch',
    borderRadius: 5,
  },
  modalButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
  },
  modalCloseButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
});

export default ItemManagement;
