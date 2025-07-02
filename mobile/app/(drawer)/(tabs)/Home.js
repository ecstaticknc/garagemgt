import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing, TouchableOpacity,Dimensions } from 'react-native'; // Removed Dimensions
import { List, Divider, Text, Card, useTheme } from 'react-native-paper';
import { useAuth } from '../../../context/AuthContext';
import API from '../../config/axiosInstance';
import { useNavigation, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';

// Removed SVG and d3-shape imports:
import Svg, { G, Path } from 'react-native-svg';
import { pie, arc } from 'd3-shape';
import BikeAnimation from '~/components/BikeAnimation';
const screenWidth = Dimensions.get('window').width-10;

export default function Home() {
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;

  const { userScId, logout } = useAuth();
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // States for counts
  const [customerCount, setCustomerCount] = useState(0);
  const [totalServiceHistoryCount, setTotalServiceHistoryCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [errorCounts, setErrorCounts] = useState(null);

  useEffect(() => {
    const fetchServiceCenterData = async () => {
      if (userScId !== null && userScId !== undefined) {
        try {
          setLoadingInfo(true);
          setErrorInfo(null);
          const response = await API._get(`/servicecenters/${userScId}`);
          setServiceCenterInfo(response.data.data);
        } catch (error) {
          console.error("Failed to fetch service center data:", error);
          setErrorInfo("Failed to load service center details. Please try again.");
        } finally {
          setLoadingInfo(false);
        }
      } else {
        setServiceCenterInfo(null);
        setLoadingInfo(false);
      }
    };

    fetchServiceCenterData();
  }, [userScId]);

  // Function to fetch customer count
  const fetchCustomerCount = useCallback(async () => {
    if (!userScId) return 0;
    try {
      const response = await API._get(`/customers/by-sc?scId=${userScId}`);
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.length;
      }
      return 0;
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      return 0;
    }
  }, [userScId]);

  // Function to fetch total service history count
  const fetchTotalServiceHistoryCount = useCallback(async () => {
    if (!userScId) return 0;
    try {
      const response = await API._get(`/servicehistory/byServiceCenter?scId=${userScId}`);
      let allServiceHistory = [];
      response.data.data.forEach(customerData => {
        if (customerData.serviceHistory && Array.isArray(customerData.serviceHistory)) {
          allServiceHistory = allServiceHistory.concat(customerData.serviceHistory);
        }
      });
      return allServiceHistory.length;
    } catch (error) {
      console.error("Failed to fetch total service history data:", error);
      return 0;
    }
  }, [userScId]);

  // Function to fetch reminder count (reusing logic from Reminder.js)
  const fetchReminderCount = useCallback(async () => {
    if (!userScId) return 0;
    try {
      const response = await API._get(`/servicehistory/byServiceCenter?scId=${userScId}`);
      let allServiceHistory = [];
      response.data.data.forEach(customerData => {
        if (customerData.serviceHistory && Array.isArray(customerData.serviceHistory)) {
          allServiceHistory = allServiceHistory.concat(customerData.serviceHistory);
        }
      });

      const now = moment();
      const threeMonthsAgo = now.clone().subtract(3, 'months');
      const startOfCurrentYear = moment().startOf('year');
      const endOfCurrentYear = moment().endOf('year');

      const filteredReminders = allServiceHistory.filter(item => {
        if (!item.serviceDate) return false;
        const serviceDate = moment(item.serviceDate);
        return (
          serviceDate.isBefore(threeMonthsAgo) &&
          serviceDate.isBetween(startOfCurrentYear, endOfCurrentYear, null, '[]')
        );
      });
      return filteredReminders.length;
    } catch (error) {
      console.error("Failed to fetch reminder data:", error);
      return 0;
    }
  }, [userScId]);

  // Effect to load all counts in parallel
  useEffect(() => {
    if (userScId) {
      const loadAllCounts = async () => {
        setLoadingCounts(true);
        setErrorCounts(null);
        try {
          const [customers, totalHistory, reminders] = await Promise.all([
            fetchCustomerCount(),
            fetchTotalServiceHistoryCount(),
            fetchReminderCount()
          ]);
          setCustomerCount(customers);
          setTotalServiceHistoryCount(totalHistory);
          setReminderCount(reminders);
        } catch (err) {
          setErrorCounts("Failed to load some dashboard counts.");
          console.error("Error loading dashboard counts:", err);
        } finally {
          setLoadingCounts(false);
        }
      };
      loadAllCounts();
    }
  }, [userScId, fetchCustomerCount, fetchTotalServiceHistoryCount, fetchReminderCount]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const chartColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#4a6da7', // Purple
  '#c9123f', // Red
  '#607D8B', // Blue Grey
  '#FFC107', // Amber
  '#11c7db', // Teal
];

const pieData = [
  { label: "ग्राहक", value: customerCount, color: chartColors[3] },
  { label: "सर्विस झालेले", value: totalServiceHistoryCount, color: chartColors[7] },
  { label: "रिमाइंडर्स", value: reminderCount, color: chartColors[6] },
].filter(d => d.value > 0);

  const pieChartRadius = screenWidth * 0.3; // Example radius, adjust as needed
  const innerRadius = pieChartRadius * 0.6; // For donut chart effect

  const pieGenerator = pie().value(d => d.value);
  const arcGenerator = arc()
    .outerRadius(pieChartRadius)
    .innerRadius(innerRadius);


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Header Gradient */}
      <LinearGradient
        colors={[colors.primary, '#4a6da7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        
        
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.serviceCenterName}>
              {serviceCenterInfo?.serviceCenterName || 'Service Center'}
            </Text>
          </View>

          {/* <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
            <Icon name="tools" size={40} color="#fff" />
          </Animated.View> */}
          <BikeAnimation />

          
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loadingInfo || loadingCounts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              डॅशबोर्ड डेटा लोड होत आहे...
            </Text>
          </View>
        ) : errorInfo || errorCounts ? (
          <Card style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Card.Content style={styles.errorContent}>
              <Icon name="alert-circle" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errorInfo || errorCounts}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            {serviceCenterInfo ? (
              <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.05)']}
                  style={styles.cardGradient}
                />

                <Card.Title
                  title={serviceCenterInfo.proprietorName}
                  titleStyle={[styles.cardTitle, { color: colors.primary }]}
                  subtitle="Proprietor"
                  subtitleStyle={[styles.cardSubtitle, { color: colors.onSurface }]}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="account-tie"
                      color={colors.primary}
                    />
                  )}
                />

                <Divider style={styles.divider} />

                <Card.Content style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <Icon name="phone" size={20} color={colors.primary} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {serviceCenterInfo.proprietorMobile}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="email" size={20} color={colors.primary} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {serviceCenterInfo.proprietorEmail}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="map-marker" size={20} color={colors.primary} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {serviceCenterInfo.serviceCenterAddress}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.noInfoContainer}>
                <Icon name="information-outline" size={40} color={colors.primary} />
                <Text style={[styles.noInfoText, { color: colors.text }]}>
                  No service center information available
                </Text>
              </View>
            )}

            {/* Dashboard Counts Section - Now with colorful gradients! */}
            <View style={styles.dashboardCountsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>सारांश</Text>
              <View style={styles.countsGrid}>
                {/* Customer Count Card */}
                <TouchableOpacity
                  style={styles.countCardTouch}
                  onPress={() => router.push('/customers/CList')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#8BC34A']} // Greenish gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCardContent}
                  >
                    <Icon name="account-group" size={30} color="#fff" />
                    <Text style={styles.countTextWhite}>{customerCount}</Text>
                    <Text style={styles.countLabelWhite}>ग्राहक</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Service History Count Card */}
                <TouchableOpacity
                  style={styles.countCardTouch}
                  onPress={() => router.push('/servicehistory/SHList')}
                >
                  <LinearGradient
                    colors={['#2196F3', '#03A9F4']} // Bluish gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCardContent}
                  >
                    <Icon name="tools" size={30} color="#fff" />
                    <Text style={styles.countTextWhite}>{totalServiceHistoryCount}</Text>
                    <Text style={styles.countLabelWhite}>सर्विसेस</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Reminders Count Card */}
                <TouchableOpacity
                  style={styles.countCardTouch}
                  onPress={() => router.push('/(drawer)/(tabs)/Reminder')}
                >
                  <LinearGradient
                    colors={['#FF9800', '#FF5722']} // Orangish-red gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCardContent}
                  >
                    <Icon name="bell-ring" size={30} color="#fff" />
                    <Text style={styles.countTextWhite}>{reminderCount}</Text>
                    <Text style={styles.countLabelWhite}>रिमाइंडर्स</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pie Chart Section using d3-shapes and react-native-svg */}
            <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>कार्याची विभागणी</Text>
              {pieData.length > 0 ? (
                <View style={styles.pieChartContainer}>
                  <Svg width={pieChartRadius * 2} height={pieChartRadius * 2}>
                    <G x={pieChartRadius} y={pieChartRadius}>
                      {
                        pieGenerator(pieData).map((slice, index) => (
                          <Path
                            key={index}
                            d={arcGenerator(slice)}
                            fill={slice.data.color}
                          />
                        ))
                      }
                    </G>
                  </Svg>
                  <View style={styles.legendContainer}>
                    {pieData.map((data, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: data.color }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>{data.label}: {data.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[styles.noChartDataText, { color: colors.lightText }]}>
                  No data available to display chart.
                </Text>
              )}
            </View>

            {/* Navigation Section (Quick Actions) - kept as List.Item for different style/behavior */}
            <View style={styles.navigationSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              <List.Item
                title={`ग्राहक लिस्ट (${customerCount})`}
                description="तुमचे सर्व ग्राहक पहा आणि व्यवस्थापित करा"
                left={props => <List.Icon {...props} icon="account-group" color={colors.primary} />}
                onPress={() => router.push('/customers/CList')}
                style={styles.listItem}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.lightText }}
              />
              <Divider style={styles.divider} />
              <List.Item
                title={`सर्विस इतिहास (${totalServiceHistoryCount})`}
                description="सर्व वाहनांसाठी मागील सेवांचा इतिहास पहा"
                left={props => <List.Icon {...props} icon="bike" color={colors.primary} />}
                onPress={() => router.push('/servicehistory/SHList')}
                style={styles.listItem}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.lightText }}
              />
              <Divider style={styles.divider} />
              <List.Item
                title={`सर्विस रिमाइंडर्स (${reminderCount})`}
                description="ज्या ग्राहकांना फॉलो-अप सेवेची आवश्यकता आहे त्यांना रिमाइंडर पाठवा"
                left={props => <List.Icon {...props} icon="bell-ring" color={colors.primary} />}
                onPress={() => router.push('/(drawer)/(tabs)/Reminder')}
                style={styles.listItem}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.lightText }}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  serviceCenterName: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 30,
    marginLeft: 20,
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.69)',
  },
  cardContent: {
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  infoIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    flexShrink: 1,
  },
  noInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noInfoText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorCard: {
    borderRadius: 16,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFEBEE',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  dashboardCountsSection: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  countCardTouch: {
    width: '30%',
    margin: 5,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  gradientCardContent: {
    alignItems: 'center',
    paddingVertical: 15,
    flex: 1,
    justifyContent: 'center',
    borderRadius: 12,
  },
  countTextWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#FFFFFF',
  },
  countLabelWhite: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    color: '#f1f1f1',
  },
  // Styles for the Pie Chart Section
  chartSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    alignItems: 'center', // Center the chart horizontally
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  legendContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1, // Take remaining space
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  noChartDataText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  navigationSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});