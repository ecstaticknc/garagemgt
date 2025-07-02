import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Easing
} from 'react-native';
import { Appbar, Card, Title, ActivityIndicator, Text, Button, useTheme } from 'react-native-paper';
import API from '../../../config/axiosInstance';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router'; // Import useRouter
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const router = useRouter(); // Initialize useRouter
  const theme = useTheme();
  const { colors } = theme;
  const params = useLocalSearchParams();

  const customerId = params?.id || params?.customerId;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const fetchCustomerDetails = async () => {
    if (!customerId || isNaN(Number(customerId))) {
      setError('Invalid customer ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await API._get(`/customers/${customerId}`);

      if (!response.data?.data) {
        throw new Error('Customer not found');
      }
      setCustomer(response.data.data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomerDetails();
  };

  const handleEdit = () => {
    // Assuming 'CustomerForm' is the correct route name/path for your customer edit form
    // If CustomerForm is within the same stack as CustomerDetailScreen, navigation.navigate might work.
    // Otherwise, use router.push with the full path like:
    // router.push('/customers/CustomerForm', { ... })
    navigation.navigate('CForm', { // Changed from 'CustomerForm' to 'CForm' to match the naming in CustomerListScreen.js
      customer: JSON.stringify(customer),
      onGoBack: fetchCustomerDetails
    });
  };

  const startDeleteAnimation = () => {
    setIsDeleting(true);

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ]).start(() => {
      // Pulse animation after shaking
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start(() => {
        handleDeleteConfirmation();
      });
    });
  };

  const handleDeleteConfirmation = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resetDeleteAnimation()
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API._delete(`/customers/${customerId}`);
              Alert.alert('Success', 'Customer deleted');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
              resetDeleteAnimation();
            }
          }
        }
      ]
    );
  };

  const resetDeleteAnimation = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true
      }),
      Animated.spring(shakeAnim, {
        toValue: 0,
        friction: 3,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsDeleting(false);
    });
  };

  const handleServiceHistory = () => {
    // Use router.push with the absolute path for cross-tab/stack navigation
    router.push({
      pathname: '/servicehistory/SHList', // Corrected path based on typical Expo Router structure
      params: {
        customerId: customer.id,
        customerName: customer.customerName
      }
    });
  };

  const renderDeleteButton = () => {
    return (
      <Animated.View
        style={[
          styles.deleteButtonContainer,
          {
            transform: [
              { translateX: shakeAnim },
              { scale: scaleAnim }
            ],
            borderColor: colors.error
          }
        ]}
      >
        <TouchableOpacity
          onPress={startDeleteAnimation}
          disabled={isDeleting}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Icon name="delete" size={24} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>
            Delete Customer
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading customer details...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Icon name="alert-circle" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={handleRefresh}
            style={styles.button}
            icon="refresh"
          >
            Retry
          </Button>
        </View>
      );
    }

    if (!customer) {
      return (
        <View style={styles.center}>
          <Icon name="account-question" size={40} color={colors.text} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Customer not found
          </Text>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Go Back
          </Button>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={[styles.title, { color: colors.primary }]}>
                {customer.customerName}
              </Title>
              <Icon name="account" size={24} color={colors.primary} />
            </View>

            <View style={styles.detailRow}>
              <Icon name="identifier" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                ID: {customer.id}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Mobile: {customer.mobile || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="bike" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Vehicles: {customer.vehicles || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Registered: {customer.regDate ? new Date(customer.regDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleServiceHistory}
            style={styles.button}
            icon="history"
            contentStyle={styles.buttonContent}
          >
            सेवेचा इतिहास
          </Button>

          <Button
            mode="outlined"
            onPress={handleEdit}
            style={styles.button}
            icon="pencil"
            contentStyle={styles.buttonContent}
          >
            सुधारा ग्राहक 
          </Button>

          {renderDeleteButton()}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Customer Details" />
        {customer && (
          <>
            {/* <Appbar.Action
              icon="refresh"
              onPress={handleRefresh}
              color={colors.primary}
            />
            <Appbar.Action
              icon="pencil"
              onPress={handleEdit}
              color={colors.primary}
            /> */}
          </>
        )}
      </Appbar.Header>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  deleteButtonContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomerDetailScreen;