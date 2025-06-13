import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert, // Added for alerts
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import UserRoutes from '~/backend/UserRoutes';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
// import { Route } from 'expo-router/build/Route'; // This import is not used and can be removed

const functionTypes = [
  'हळद कार्यक्रम','लग्न सोहळा','सत्यनारायण पूजा', 'साखरपुडा','वाढदिवस कार्यक्रम','मेजवानी',
  , 'नामकरण', 'गृहप्रवेश',  'पार्टी', 'कार्यक्रम',
  'मुंज', 'डोहाळजेवण', 'पूजा', 'ऑफिस पार्टी', 'धार्मिक कार्यक्रम', 'इतर',
];

// Fixed options
const breadOptions = ['चपाती', 'पुरी', 'मसाला पुरी'];
const riceOptions = ['जिरा भात', 'साधी भात', 'पुलाव'];
const otherOptions = ['कोशिंबीर', 'सालाद', 'पापड', 'चटणी', 'लोणचे','मठ्ठा'];

// Item कॉम्पोनंटमध्ये बदल
const Item = memo(({ item, updateItemQuantity }) => { // Removed index as it's not used here directly for UI
  const [inputValue, setInputValue] = useState(item.quantity === 0 ? '' : item.quantity.toString());

  useEffect(() => {
    const newValue = item.quantity === 0 ? '' : item.quantity.toString();
    if (inputValue !== newValue) {
      setInputValue(newValue);
    }
  }, [item.quantity]);

  const handleQuantityChange = useCallback(
    (value) => {
      let cleanedValue = value.replace(/[^0-9.]/g, '');

      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
      }

      // Max 3 digits before decimal, no change in behavior
      if (parts[0] && parts[0].length > 3) {
        cleanedValue = parts[0].substring(0, 3) + (parts[1] ? '.' + parts[1] : '');
      }

      if (value.endsWith('.') && !cleanedValue.includes('.')) {
        cleanedValue += '.';
      }

      setInputValue(cleanedValue);

      const finalNumericValue = cleanedValue === '' || cleanedValue === '.' ? 0 : parseFloat(cleanedValue);
      updateItemQuantity(item.itemId, finalNumericValue);
    },
    [item.itemId, updateItemQuantity]
  );

  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName}>{item.name}</Text>
      <TextInput
        style={styles.itemInput}
        keyboardType="decimal-pad"
        placeholder="0"
        value={inputValue}
        onChangeText={handleQuantityChange}
      />
      <Text style={styles.itemUnit}>{item.unit}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.unit === nextProps.item.unit &&
    prevProps.item.itemId === nextProps.item.itemId
  );
});

const ItemsModal = memo(({ visible, onClose, items, loading, updateItemQuantity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // New state to manage expansion of each category within the modal
  const [expandedCategories, setExpandedCategories] = useState({});

  // Memoized grouped and sorted items for the modal
  const groupedAndSortedItems = useMemo(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce((acc, item) => {
      const category = item.category || 'इतर';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Initialize expandedCategories state if it's empty or new categories appear
    // This runs on every items/searchQuery change, ensuring new categories are expanded by default
    const newExpandedState = {};
    let shouldUpdateExpandedState = false;
    sortedCategories.forEach(cat => {
      if (expandedCategories[cat] === undefined) {
        newExpandedState[cat] = true; // Default to expanded
        shouldUpdateExpandedState = true;
      } else {
        newExpandedState[cat] = expandedCategories[cat];
      }
    });

    if (shouldUpdateExpandedState || Object.keys(newExpandedState).length !== Object.keys(expandedCategories).length) {
        // Only update if there are new categories or categories removed due to filter
        setExpandedCategories(newExpandedState);
    }


    return sortedCategories; // Return just the sorted category names
  }, [items, searchQuery, expandedCategories]); // Add expandedCategories as dependency to re-run on state change

  // Toggle function for category expansion
  const toggleCategoryExpansion = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const renderModalContent = useCallback(({ item: category }) => { // 'item' here is the category name
    const categoryItems = groupedAndSortedItems.length > 0 && items.filter(i => (i.category || 'इतर') === category)
      //.sort((a, b) => a.name.localeCompare(b.name));

    if (!categoryItems || categoryItems.length === 0) {
      return null; // Don't render empty categories
    }

    const isCategoryExpanded = expandedCategories[category];

    return (
      <View style={styles.categoryGroup}>
        <TouchableOpacity onPress={() => toggleCategoryExpansion(category)} style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category} ({categoryItems.length})</Text>
          <Feather
            name={isCategoryExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#2c3e50"
          />
        </TouchableOpacity>

        {isCategoryExpanded && (
          <FlatList
            data={categoryItems}
            keyExtractor={(item) => `modal-item-${item.itemId}`}
            renderItem={({ item }) => (
              <Item item={item} updateItemQuantity={updateItemQuantity} />
            )}
            scrollEnabled={false} // Important for nested FlatLists
          />
        )}
      </View>
    );
  }, [expandedCategories, groupedAndSortedItems, items, toggleCategoryExpansion, updateItemQuantity]);

  // Key extractor for the main FlatList (rendering categories)
  const keyExtractorCategory = useCallback((category) => `category-group-${category}`, []);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>सामग्री यादी</Text>
            <TouchableOpacity onPress={() => router.push('ItemManagement')} style={styles.newItemButtonCard}>
              <Text style={styles.newItemButtonText}>नवीन सामग्री</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="सामग्री शोधा..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#4682B4" style={styles.loadingIndicator} />
          ) : (
            <FlatList
              data={groupedAndSortedItems} // Now data is just the category names
              keyExtractor={keyExtractorCategory}
              renderItem={renderModalContent} // New render function for categories
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={5} // Adjust as needed
              maxToRenderPerBatch={3} // Adjust as needed
              windowSize={3} // Adjust as needed
              ListEmptyComponent={() => (
                <Text style={styles.noItemsText}>कोणतीही सामग्री सापडली नाही.</Text>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});


const CheckboxGroup = memo(({ title, options, selectedItems, onSelectionChange }) => {
  return (
    <View style={styles.checkboxGroup}>
      <Text style={styles.checkboxGroupTitle}>{title}</Text>
      <View style={styles.checkboxContainer}>
        {options.map((option, index) => (
          <View key={index} style={styles.checkboxRow}>
            <Checkbox
              status={selectedItems.includes(option) ? 'checked' : 'unchecked'}
              onPress={() => {
                const newSelection = selectedItems.includes(option)
                  ? selectedItems.filter(i => i !== option)
                  : [...selectedItems, option];
                onSelectionChange(newSelection);
              }}
              color="#4682B4"
            />
            <Text style={styles.checkboxLabel}>{option}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const CustomizableOptions = ({
  title,
  options,
  selectedItems,
  onSelectionChange,
  onAddNewItem
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddNewItem(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <View style={styles.optionGroup}>
      <Text style={styles.optionGroupTitle}>{title}</Text>

      <View style={styles.checkboxContainer}>
        {options.map((option, index) => (
          <View key={index} style={styles.checkboxRow}>
            <Checkbox
              status={selectedItems.includes(option) ? 'checked' : 'unchecked'}
              onPress={() => {
                const newSelection = selectedItems.includes(option)
                  ? selectedItems.filter(i => i !== option)
                  : [...selectedItems, option];
                onSelectionChange(newSelection);
              }}
              color="#4682B4"
            />
            <Text style={styles.checkboxLabel}>{option}</Text>
          </View>
        ))}
      </View>

      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.addItemInput}
          placeholder={`नवीन ${title.toLowerCase()} टाका`}
          value={newItem}
          onChangeText={setNewItem}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CustomerAddScreen = () => {
  const db = useSQLiteContext();

  const [sweetDishes, setSweetDishes] = useState(['गुलाबजामुन', 'जिलेबी']);
  const [dryVegetableDishes, setDryVegetableDishes] = useState(['पनीर मसाला', 'मिक्स भाजी']);
  const [gravyVegetableDishes, setGravyVegetableDishes] = useState(['डाळीची आमटी', 'दाल फ्राई']);

  const [customer, setCustomer] = useState({
    fullName: '',
    mobile: '',
    address: '',
    venueAddress: '',
    functionType: '',
    functionDate: '',
    totalAmount: '',
    advanceAmount: '',
    balanceAmount: '',
    mealMenu: {
      sweetDishes: [],
      dryVegetableDishes: [],
      gravyVegetableDishes: [],
      breads: [],
      rice: [],
      others: [],
    }
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const { fullName, mobile, functionType, functionDate, totalAmount, mealMenu } = customer;

    const areMainFieldsFilled = fullName.trim() !== '' &&
      mobile.trim() !== '' &&
      functionType.trim() !== '' &&
      functionDate.trim() !== '' &&
      totalAmount.trim() !== '';

    const areMealMenuCategoriesSelected = mealMenu.sweetDishes.length > 0 &&
      mealMenu.dryVegetableDishes.length > 0 &&
      mealMenu.gravyVegetableDishes.length > 0 &&
      mealMenu.breads.length > 0 &&
      mealMenu.rice.length > 0 &&
      mealMenu.others.length > 0;

    const selectedItemsExist = items.some(item => item.quantity > 0);

    const isValid = areMainFieldsFilled && areMealMenuCategoriesSelected && selectedItemsExist;

    setIsFormValid(isValid);
  }, [customer, items]);

  const handleAmountChange = useCallback((field, value) => {
    setCustomer(prev => {
      const newCustomer = { ...prev, [field]: value };

      if (field === 'totalAmount' || field === 'advanceAmount') {
        const total = parseFloat(newCustomer.totalAmount) || 0;
        const advance = parseFloat(newCustomer.advanceAmount) || 0;
        newCustomer.balanceAmount = (total - advance).toString();
      }

      return newCustomer;
    });
  }, []);

  const handleMealMenuChange = useCallback((category, selectedItems) => {
    setCustomer(prev => ({
      ...prev,
      mealMenu: {
        ...prev.mealMenu,
        [category]: selectedItems
      }
    }));
  }, []);

  const handleAddSweetDish = (newDish) => {
    setSweetDishes(prev => [...prev, newDish]);
  };

  const handleAddVegetableDish = useCallback((newDish, type) => {
    if (type === 'dry') {
      setDryVegetableDishes(prev => {
        const formattedDish = newDish.includes('(सुकी)') ? newDish : `${newDish} (सुकी)`;
        return [...prev, formattedDish];
      });
    } else if (type === 'gravy') {
      setGravyVegetableDishes(prev => {
        const formattedDish = newDish.includes('(पातळ)') ? newDish : `${newDish} (पातळ)`;
        return [...prev, formattedDish];
      });
    }
  }, []);

  const fetchItemsFromDB = useCallback(async () => {
    try {
      setLoading(true);
      const result = await UserRoutes.getIngredientItems(db);
      const itemsWithIds = result.map((item, index) => ({ ...item, quantity: 0, itemId: item.itemId || index }));
      setItems(itemsWithIds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'सामग्री लोड करताना त्रुटी आली.');
      setLoading(false);
    }
  }, [db]);

  const updateItemQuantity = useCallback((itemId, value) => {
    setItems(prevItems => {
      return prevItems.map(item =>
        item.itemId === itemId ? { ...item, quantity: value } : item
      );
    });
  }, []);


  const handleSave = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('अपूर्ण माहिती', 'कृपया सर्व आवश्यक फील्ड भरा (ग्राहक माहिती, कार्यक्रम, जेवणाचे मेनू आणि सामग्री).');
      return;
    }

    const selectedItems = items.filter(item => item.quantity > 0);

    const payload = {
      ...customer,
      mealMenu: {
        ...customer.mealMenu,
        vegetableDishes: [...customer.mealMenu.dryVegetableDishes, ...customer.mealMenu.gravyVegetableDishes]
      },
      items: selectedItems.map(({ name, quantity, category, unit }) => ({
        name,
        quantity,
        category: category,
        unit,
      }))
    };

    try {
      await UserRoutes.saveCustomerInfo(db, payload);

      Alert.alert("यशस्वी!", "ग्राहक माहिती यशस्वीरित्या जतन केली!");
      setCustomer({
        fullName: '',
        mobile: '',
        address: '',
        venueAddress: '',
        functionType: '',
        functionDate: '',
        totalAmount: '',
        advanceAmount: '',
        balanceAmount: '',
        mealMenu: {
          sweetDishes: [],
          dryVegetableDishes: [],
          gravyVegetableDishes: [],
          breads: [],
          rice: [],
          others: [],
        }
      });
      setItems(prev => prev.map(item => ({ ...item, quantity: 0 })));
      router.push('/(tabs)/customerlist');

    } catch (error) {
      console.error("Error saving customer info:", error);
      Alert.alert("त्रुटी", "ग्राहक माहिती जतन करताना त्रुटी आली.");
    }
  }, [customer, items, db, isFormValid]);

  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const d = new Date(selectedDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      setCustomer(prev => ({ ...prev, functionDate: `${day}-${month}-${year}` }));
    }
  }, []);

  const openItemsModal = useCallback(async () => {
    await fetchItemsFromDB();
    setModalVisible(true);
  }, [fetchItemsFromDB]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ग्राहक माहिती</Text>

        <TextInput
          style={styles.input}
          placeholder="पूर्ण नाव"
          value={customer.fullName}
          onChangeText={(text) => setCustomer(prev => ({ ...prev, fullName: text }))}
        />

        <TextInput
          style={styles.input}
          placeholder="मोबाईल नंबर"
          keyboardType="phone-pad"
          maxLength={10}
          value={customer.mobile}
          onChangeText={(text) => setCustomer(prev => ({ ...prev, mobile: text }))}
        />

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="पत्ता"
          multiline
          value={customer.address}
          onChangeText={(text) => setCustomer(prev => ({ ...prev, address: text }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>कार्यक्रम माहिती</Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={customer.functionType}
            onValueChange={(value) => setCustomer(prev => ({ ...prev, functionType: value }))}
            style={styles.picker}
          >
            <Picker.Item label="कार्यक्रम निवडा" value="" />
            {functionTypes.map((type, index) => (
              <Picker.Item key={index} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text style={[styles.dateText, !customer.functionDate && styles.placeholderText]}>
            {customer.functionDate || 'कार्यक्रम दिनांक निवडा'}
          </Text>
          <Feather name="calendar" size={20} color="#555" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="कार्यक्रमचा पत्ता"
          multiline
          value={customer.venueAddress}
          onChangeText={(text) => setCustomer(prev => ({ ...prev, venueAddress: text }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>जेवणाचे मेनू</Text>

        <CustomizableOptions
          title="गोड पदार्थ"
          options={sweetDishes}
          selectedItems={customer.mealMenu.sweetDishes}
          onSelectionChange={(selected) => handleMealMenuChange('sweetDishes', selected)}
          onAddNewItem={handleAddSweetDish}
        />

        <CustomizableOptions
          title="भाजी (सुकी)"
          options={dryVegetableDishes}
          selectedItems={customer.mealMenu.dryVegetableDishes}
          onSelectionChange={(selected) => handleMealMenuChange('dryVegetableDishes', selected)}
          onAddNewItem={(newDish) => handleAddVegetableDish(newDish, 'dry')}
        />

        <CustomizableOptions
          title="भाजी (पातळ)"
          options={gravyVegetableDishes}
          selectedItems={customer.mealMenu.gravyVegetableDishes}
          onSelectionChange={(selected) => handleMealMenuChange('gravyVegetableDishes', selected)}
          onAddNewItem={(newDish) => handleAddVegetableDish(newDish, 'gravy')}
        />

        <CheckboxGroup
          title="चपाती:"
          options={breadOptions}
          selectedItems={customer.mealMenu.breads}
          onSelectionChange={(selected) => handleMealMenuChange('breads', selected)}
        />

        <CheckboxGroup
          title="भात:"
          options={riceOptions}
          selectedItems={customer.mealMenu.rice}
          onSelectionChange={(selected) => handleMealMenuChange('rice', selected)}
        />

        <CheckboxGroup
          title="अन्य:"
          options={otherOptions}
          selectedItems={customer.mealMenu.others}
          onSelectionChange={(selected) => handleMealMenuChange('others', selected)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>पेमेंट</Text>

        <TextInput
          style={styles.input}
          placeholder="कार्यक्रम रक्कम (₹)"
          keyboardType="numeric"
          value={customer.totalAmount}
          onChangeText={(text) => handleAmountChange('totalAmount', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="अ‍ॅडव्हान्स रक्कम (₹)"
          keyboardType="numeric"
          value={customer.advanceAmount}
          onChangeText={(text) => handleAmountChange('advanceAmount', text)}
        />

        <TextInput
          style={[styles.input, styles.disabledInput]}
          placeholder="शिल्लक रक्कम (₹)"
          value={customer.balanceAmount}
          editable={false}
        />
      </View>

      <TouchableOpacity
        style={styles.itemsButton}
        onPress={openItemsModal}
      >
        <Text style={styles.itemsButtonText}>सामग्री यादी जोडा</Text>
      </TouchableOpacity>

      <ItemsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        items={items}
        loading={loading}
        updateItemQuantity={updateItemQuantity}
      />

      <TouchableOpacity
        style={[styles.saveButton, !isFormValid && styles.disabledSaveButton]}
        onPress={handleSave}
        disabled={loading || !isFormValid}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'प्रक्रिया करत आहे...' : 'सेव करा'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 18,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 55,
    width: '100%',
    textAlign: 'center',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  itemsButton: {
    backgroundColor: '#17a2b8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemsButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },
  disabledSaveButton: {
    backgroundColor: '#95d5b2',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    borderRadius: 15,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495e',
    flex: 1,
    textAlign: 'left',
  },
  newItemButtonCard: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  newItemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#dc3545',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    margin: 15,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  // Item row styles - centered vertically
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center', // Aligns items vertically in the center
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fff',
  },
  itemName: {
    flex: 1.5,
    fontSize: 16,
    color: '#333',
    paddingLeft: 5,
    // Ensure text is vertically centered within its own box
    textAlignVertical: 'center',
  },
  itemInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 10,
    width: 90,
    textAlign: 'center',
    marginHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    // Ensure text is vertically centered within its own box
    textAlignVertical: 'center',
  },
  itemUnit: {
    width: 50,
    fontSize: 16,
    color: '#555',
    // Ensure text is vertically centered within its own box
    textAlignVertical: 'center',
  },
  loadingIndicator: {
    paddingVertical: 40,
  },
  // Category Group styles for the modal
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
    backgroundColor: '#e9f7ef', // Light green background for category headers
    borderBottomWidth: 1,
    borderBottomColor: '#d1e7dd', // Slightly darker green border
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  checkboxGroup: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  checkboxGroupTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2F4F4F',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  optionGroup: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  optionGroupTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2F4F4F',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#17a2b8',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default CustomerAddScreen;