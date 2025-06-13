import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { getTableNames, clearSelectedTables, clearAndRecreateTables, initializeDatabase } from '../../../assets/DatabaseInit';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const ResetDatabaseScreen = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSelected, setIsSubmittingSelected] = useState(false); // Renamed for clarity
  const [isSubmittingAll, setIsSubmittingAll] = useState(false); // Renamed for clarity

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const tableNames = await getTableNames(db);
      setTables(tableNames);
      const initialSelection = tableNames.reduce((acc, tableName) => {
        acc[tableName] = false;
        return acc;
      }, {});
      setSelectedTables(initialSelection);
    } catch (error) {
      console.error('Error fetching table names:', error);
      Alert.alert('त्रुटी', 'डेटाबेस सारण्या मिळवण्यात अयशस्वी.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTables();
    }, [])
  );

  const toggleCheckbox = (tableName) => {
    setSelectedTables(prevState => ({
      ...prevState,
      [tableName]: !prevState[tableName],
    }));
  };

  const handleResetAction = async (actionType) => {
    if (actionType === 'selected') {
      const tablesToClear = Object.keys(selectedTables).filter(
        tableName => selectedTables[tableName]
      );

      if (tablesToClear.length === 0) {
        Alert.alert('माहिती', 'कृपया रीसेट करण्यासाठी किमान एक सारणी निवडा.');
        return;
      }

      Alert.alert(
        'सारण्या रीसेट करा',
        `तुम्ही निवडलेल्या ${tablesToClear.length} सारण्यांमधील सर्व डेटा हटवण्यास खात्री आहे का? ही क्रिया पूर्ववत करता येणार नाही:\n\n${tablesToClear.join(', ')}`,
        [
          { text: 'रद्द करा', style: 'cancel' },
          {
            text: 'रीसेट करा',
            onPress: async () => {
              setIsSubmittingSelected(true);
              try {
                await clearSelectedTables(db, tablesToClear);
                Alert.alert('यशस्वी', 'निवडलेल्या सारण्या यशस्वीरित्या रीसेट केल्या.');
                await fetchTables();
                router.navigate('/(drawer)/(tabs)/home');
              } catch (error) {
                console.error('Error clearing selected tables:', error);
                Alert.alert('त्रुटी', 'सारण्या रीसेट करताना त्रुटी आली.');
              } finally {
                setIsSubmittingSelected(false);
              }
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    } else if (actionType === 'all') {
      Alert.alert(
        'पूर्ण डेटाबेस रीसेट करा',
        'तुम्ही सर्व डेटाबेस सारण्यांमधील सर्व डेटा हटवून आणि पुन्हा तयार करण्यास खात्री आहे का? ही क्रिया पूर्ववत करता येणार नाही आणि यामुळे सर्व डेटा गमावला जाईल!',
        [
          { text: 'रद्द करा', style: 'cancel' },
          {
            text: 'सर्व रीसेट करा',
            onPress: async () => {
              setIsSubmittingAll(true);
              try {
                await clearAndRecreateTables(db);
                Alert.alert('यशस्वी', 'सर्व डेटाबेस यशस्वीरित्या रीसेट आणि पुन्हा तयार केला गेला.');
                await fetchTables();
                router.navigate('/(drawer)/(tabs)/home');
              } catch (error) {
                console.error('Error performing full database reset:', error);
                Alert.alert('त्रुटी', 'पूर्ण डेटाबेस रीसेट करताना त्रुटी आली.');
              } finally {
                setIsSubmittingAll(false);
              }
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.tableItem}>
      <Text style={styles.tableName}>{item}</Text>
      <Checkbox.Android
        status={selectedTables[item] ? 'checked' : 'unchecked'}
        onPress={() => toggleCheckbox(item)}
        color={'#FF8C00'}
        uncheckedColor={'#999'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>सारण्या लोड करत आहे...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>डेटाबेस सारण्या रीसेट करा</Text>
      <Text style={styles.instructions}>
        तुम्ही हटवू इच्छित असलेल्या सारण्या निवडा. या निवडलेल्या सारण्यांमधील सर्व डेटा कायमचा हटवला जाईल.
      </Text>

      {tables.length === 0 ? (
        <Text style={styles.emptyText}>कोणतीही सारणी आढळली नाही.</Text>
      ) : (
        <FlatList
          data={tables}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          style={styles.tableList}
        />
      )}

      {/* Reused TouchableOpacity for "Reset Selected Tables" */}
      <TouchableOpacity
        style={[
          styles.actionButton, // Common style
          styles.submitButton, // Specific style
          (isSubmittingSelected || isSubmittingAll) && styles.submitButtonDisabled // Disable when either action is pending
        ]}
        onPress={() => handleResetAction('selected')}
        disabled={isSubmittingSelected || isSubmittingAll}
      >
        {isSubmittingSelected ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>निवडलेल्या सारण्या रीसेट करा</Text>
        )}
      </TouchableOpacity>

      {/* Reused TouchableOpacity for "Reset All Tables" */}
      <TouchableOpacity
        style={[
          styles.actionButton, // Common style
          styles.fullResetButton, // Specific style
          (isSubmittingSelected || isSubmittingAll) && styles.submitButtonDisabled // Disable when either action is pending
        ]}
        onPress={() => handleResetAction('all')}
        disabled={isSubmittingSelected || isSubmittingAll}
      >
        {isSubmittingAll ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>सर्व सारण्या रीसेट करा आणि पुन्हा तयार करा</Text>
        )}
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableList: {
    flex: 1,
    width: '100%',
  },
  tableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tableName: {
    fontSize: 18,
    color: '#333',
  },
  // Common style for action buttons
  actionButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Common margin top
  },
  submitButton: {
    backgroundColor: '#d62279',
    marginTop: 20, // Add more top margin for the first button
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullResetButton: {
    backgroundColor: '#e74c3c',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ResetDatabaseScreen;