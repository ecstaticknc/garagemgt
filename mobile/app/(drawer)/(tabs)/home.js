import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BarChart, PieChart} from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker'; // For sorting dropdown
import UserRoutes from '../../../backend/UserRoutes';
import { useSQLiteContext } from 'expo-sqlite';
import { Feather } from '@expo/vector-icons'; // For sorting icons
import { useNavigation } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(47, 128, 237, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16,
    },
};

const COLORS = [
  '#836de8', // Blue
  '#d62279', // Orange
  '#33B2FF', // Red
  '#079ebc', // Teal
  '#465256', // Green
  '#EDC948', // Yellow
  '#B07AA1', // Purple
  '#FF9DA7', // Pink
  '#9C755F', // Brown
  '#BAB0AC', // Gray
  '#86BCB6', // Mint
  '#FFBE7D', // Light Orange
  '#D37295', // Rose
  '#8CD17D', // Light Green
  '#B6992D', // Olive
  '#79706E', // Muted Gray
  '#499894', // Dark Teal
  '#D4A6C8', // Lavender
  '#A0CBE8', // Sky Blue
];

// Marathi month abbreviations
const MARATHI_MONTHS = [
    'जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून',
    'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'
];

// DrillDownModal component
const DrillDownModal = ({ visible, onClose, title, data }) => (
    <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
    >
        <View style={styles.drillDownModalContainer}>
            <View style={styles.drillDownModalContent}>
                <View style={styles.drillDownModalHeader}>
                    <Text style={styles.drillDownModalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.drillDownCloseIcon}>
                        <Feather name="x" size={24} color="#555" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    {data.length > 0 ? (
                        data.map((customer, index) => (
                            <View key={customer.id || index} style={styles.drillDownItem}>
                                <Text style={styles.drillDownItemText}>नाव: {customer.fullName}</Text>
                                <Text style={styles.drillDownItemText}>मोबाईल: {customer.mobile}</Text>
                                {customer.functionType && <Text style={styles.drillDownItemText}>कार्यक्रम: {customer.functionType}</Text>}
                                {customer.functionDate && <Text style={styles.drillDownItemText}>दिनांक: {customer.functionDate}</Text>}
                                {customer.totalAmount && <Text style={styles.drillDownItemText}>रक्कम: ₹{parseFloat(customer.totalAmount).toLocaleString('en-IN')}</Text>}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>या निवडीसाठी डेटा उपलब्ध नाही.</Text>
                    )}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

const Dashboard = () => {
    
    const db = useSQLiteContext();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [allCustomers, setAllCustomers] = useState([]); // Stores all raw customer data
    const [selectedFilter, setSelectedFilter] = useState('all_time'); // 'all_time', 'this_month', 'last_30_days', 'this_year', 'last_quarter'

    // New states for Bar Chart specific year filter
    const [selectedBarChartYear, setSelectedBarChartYear] = useState(new Date().getFullYear().toString());
    const [availableBarChartYears, setAvailableBarChartYears] = useState([]);

    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalAmount: 0,
        monthlyAmounts: { labels: [], datasets: [{ data: [] }] }, // For the bar chart
        functionTypeDistribution: [],
        upcomingFunctions: [] // Initial list, will be paginated/sorted for display
    });



    // Drill-down states
    const [drillDownModalVisible, setDrillDownModalVisible] = useState(false);
    const [drillDownTitle, setDrillDownTitle] = useState('');
    const [drillDownData, setDrillDownData] = useState([]);

    // Upcoming functions pagination/sorting states
    const [upcomingPage, setUpcomingPage] = useState(0);
    const [upcomingSortBy, setUpcomingSortBy] = useState('date'); // 'date', 'type', 'amount'
    const [upcomingSortOrder, setUpcomingSortOrder] = useState('asc'); // 'asc', 'desc'
    const FUNCTIONS_PER_PAGE = 5; // Number of functions to show per page

    const fetchAllCustomers = async () => {
            try {
                setLoading(true);
                const result = await UserRoutes.getCustomerInfo(db);
                setAllCustomers(result);

                // Determine available years for the bar chart from all customer data
                const years = new Set();
                result.forEach(customer => {
                    if (customer.functionDate) {
                        const [day, month, year] = customer.functionDate.split('-').map(Number);
                        years.add(year);
                    }
                });
                const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort descending
                setAvailableBarChartYears(sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()]);
                
                // Set default selected bar chart year to current year if available, otherwise the latest year in data
                if (sortedYears.includes(new Date().getFullYear())) {
                    setSelectedBarChartYear(new Date().getFullYear().toString());
                } else if (sortedYears.length > 0) {
                    setSelectedBarChartYear(sortedYears[0].toString());
                } else {
                    setSelectedBarChartYear(new Date().getFullYear().toString());
                }

                // Calculate initial stats with the default filter and the default bar chart year
                calculateStats(result, selectedFilter, selectedBarChartYear);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching customers:', error);
                setLoading(false);
            }
        };

    useEffect(() => {        
        fetchAllCustomers();
    }, []); // Run only once on mount

    useEffect(() => {
        // Recalculate stats whenever allCustomers, selectedFilter, or selectedBarChartYear changes
        // Pass selectedBarChartYear to calculateStats for the monthlyAmounts part
        calculateStats(allCustomers, selectedFilter, selectedBarChartYear);
        setUpcomingPage(0); // Reset pagination when filter changes
    }, [allCustomers, selectedFilter, selectedBarChartYear]);

    useFocusEffect(
    useCallback(() => {
      fetchAllCustomers();
      // No cleanup function needed for data fetching
    }, [])
  );


    const filterCustomersByDateRange = (customers, filterType, barChartYear = null) => {
        const now = new Date();
        let startDate = null;
        let endDate = null;

        // When barChartYear is provided, it means we are filtering specifically for the bar chart's monthly data
        // Otherwise, use current date for 'this_month', 'this_year', etc.
        const currentYearForFilter = (filterType === 'this_year' && barChartYear) ? parseInt(barChartYear) : now.getFullYear();

        switch (filterType) {
            case 'all_time':
                return customers; // No date filter
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'last_30_days':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                endDate = new Date(); // Today
                break;
            case 'this_year':
                startDate = new Date(currentYearForFilter, 0, 1);
                endDate = new Date(currentYearForFilter, 11, 31, 23, 59, 59, 999);
                break;
            case 'last_quarter':
                // Logic for last quarter of the *current* date context, not necessarily the selected year for bar chart
                const tempDateForQuarter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const currentMonth = tempDateForQuarter.getMonth();
                let quarterStartMonth = 0; // Default to Q1 start (Jan)
                if (currentMonth >= 0 && currentMonth <= 2) quarterStartMonth = 0; // Q1 (Jan)
                else if (currentMonth >= 3 && currentMonth <= 5) quarterStartMonth = 3; // Q2 (Apr)
                else if (currentMonth >= 6 && currentMonth <= 8) quarterStartMonth = 6; // Q3 (Jul)
                else quarterStartMonth = 9; // Q4 (Oct)
                
                let lastQuarterYear = now.getFullYear();
                let lastQuarterStartMonth = quarterStartMonth - 3;
                if (lastQuarterStartMonth < 0) {
                    lastQuarterStartMonth += 12; // Adjust for year boundary
                    lastQuarterYear -= 1;
                }
                
                startDate = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
                endDate = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0, 23, 59, 59, 999);
                break;
            default:
                return customers;
        }

        return customers.filter(customer => {
            if (!customer.functionDate) return false;
            try {
                // Convert 'DD-MM-YYYY' to Date object for comparison
                const [day, month, yearPart] = customer.functionDate.split('-').map(Number);
                const funcDate = new Date(yearPart, month - 1, day); // Month is 0-indexed for Date constructor
                return funcDate >= startDate && funcDate <= endDate;
            } catch (e) {
                console.error("Invalid functionDate format for filtering:", customer.functionDate, e);
                return false;
            }
        });
    };

    const calculateStats = (data, mainFilterType, barChartYear) => {
        // --- Calculate stats based on mainFilterType ---
        const customersForMainStats = filterCustomersByDateRange(data, mainFilterType);

        const totalCustomers = customersForMainStats.length;
        let totalAmount = 0;
        const functionTypeCounts = {};
        const upcomingFunctions = []; // This list is full for current main filter
        const now = new Date();

        customersForMainStats.forEach(customer => {
            const amount = parseFloat(customer.totalAmount) || 0;
            totalAmount += amount;

            // Upcoming functions logic remains tied to the main filter (and actual future dates)
            if (customer.functionDate) {
                const [day, month, year] = customer.functionDate.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                const funcDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (funcDateOnly > nowOnly) {
                    upcomingFunctions.push({
                        id: customer.id,
                        fullName: customer.fullName,
                        mobile: customer.mobile,
                        functionType: customer.functionType,
                        functionDate: customer.functionDate,
                        totalAmount: customer.totalAmount
                    });
                }
            }

            const type = customer.functionType || 'इतर';
            functionTypeCounts[type] = (functionTypeCounts[type] || 0) + 1;
        });

        upcomingFunctions.sort((a, b) => {
            const [dayA, monthA, yearA] = a.functionDate.split('-').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const [dayB, monthB, yearB] = b.functionDate.split('-').map(Number);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB;
        });

       
        const functionTypeDistribution = Object.keys(functionTypeCounts).map((type, i) => ({
            name: type,
            population: functionTypeCounts[type],
            color: COLORS[i % COLORS.length],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
        }));

        // --- Calculate monthly amounts specifically for the selectedBarChartYear ---
        const monthlyAmountsForBarChart = {};
        const parsedBarChartYear = parseInt(barChartYear);

        // Initialize all 12 months for the selected bar chart year with 0 amount
        for (let i = 0; i < 12; i++) {
            monthlyAmountsForBarChart[`${i + 1}/${parsedBarChartYear}`] = 0;
        }

        data.forEach(customer => { // Use 'data' (allCustomers) here, not customersForMainStats
            if (customer.functionDate) {
                const [day, month, yearPart] = customer.functionDate.split('-').map(Number);
                // Only include data for the selected bar chart year
                if (yearPart === parsedBarChartYear) {
                    const amount = parseFloat(customer.totalAmount) || 0;
                    const key = `${month}/${yearPart}`; // Use original month/year for key
                    monthlyAmountsForBarChart[key] = (monthlyAmountsForBarChart[key] || 0) + amount;
                }
            }
        });

        const sortedMonthKeys = Object.keys(monthlyAmountsForBarChart).sort((a, b) => {
            const [m1, y1] = a.split('/').map(Number);
            const [m2, y2] = b.split('/').map(Number);
            if (y1 !== y2) return y1 - y2;
            return m1 - m2;
        });

        // Store original labels and data for drill-down if needed
        const rawMonthlyAmountsLabels = sortedMonthKeys.map(key => {
            const [monthNum, yearNum] = key.split('/').map(Number);
            return MARATHI_MONTHS[monthNum - 1]; // Get Marathi month name
        });
        const rawMonthlyAmountsData = sortedMonthKeys.map(key => monthlyAmountsForBarChart[key]);

        // FILTERING: Create new arrays that only include data > 0
        const filteredMonthlyAmountsLabels = [];
        const filteredMonthlyAmountsData = [];

        rawMonthlyAmountsData.forEach((value, index) => {
            if (value > 0) {
                filteredMonthlyAmountsData.push(value);
                filteredMonthlyAmountsLabels.push(rawMonthlyAmountsLabels[index]);
            }
        });

        setStats({
            totalCustomers,
            totalAmount,
            // Pass the FILTERED data to the BarChart
            monthlyAmounts: {
                labels: filteredMonthlyAmountsLabels,
                datasets: [{ data: filteredMonthlyAmountsData }]
            },
            functionTypeDistribution,
            upcomingFunctions
        });
    };

    // Chart Interaction Handlers
    const handlePieSlicePress = (data) => {
        const selectedType = data.name;
        // Drill down data should respect the main selectedFilter
        const customersForType = filterCustomersByDateRange(allCustomers, selectedFilter).filter(
            (customer) => customer.functionType === selectedType
        );
        setDrillDownTitle(`${selectedType} कार्यक्रम`);
        setDrillDownData(customersForType);
        setDrillDownModalVisible(true);
    };

    const handleBarPress = (dataPoint, index) => {
        const selectedMonthLabel = stats.monthlyAmounts.labels[index];
        const monthNum = MARATHI_MONTHS.indexOf(selectedMonthLabel) + 1; // Get 1-indexed month number
        const year = parseInt(selectedBarChartYear); // Use the selected year for the bar chart's context

        // Drill down data for bar chart uses the specific bar chart year
        const customersForMonth = allCustomers.filter((customer) => {
            if (!customer.functionDate) return false;
            try {
                const [d, m, y] = customer.functionDate.split('-').map(Number);
                return m === monthNum && y === year;
            } catch (e) {
                console.error("Error parsing date for bar drill down:", customer.functionDate, e);
                return false;
            }
        });
        setDrillDownTitle(`${selectedMonthLabel} ${year} मधील कार्यक्रम`);
        setDrillDownData(customersForMonth);
        setDrillDownModalVisible(true);
    };

    // Upcoming Functions Sorting and Pagination Logic
    const sortedAndPaginatedUpcomingFunctions = useMemo(() => {
        let sorted = [...stats.upcomingFunctions];

        // Apply sorting
        sorted.sort((a, b) => {
            let valA, valB;
            if (upcomingSortBy === 'date') {
                valA = new Date(a.functionDate.split('-').reverse().join('-')); // YYYY-MM-DD for Date object
                valB = new Date(b.functionDate.split('-').reverse().join('-'));
            } else if (upcomingSortBy === 'type') {
                valA = a.functionType || '';
                valB = b.functionType || '';
            } else if (upcomingSortBy === 'amount') {
                valA = parseFloat(a.totalAmount) || 0;
                valB = parseFloat(b.totalAmount) || 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return upcomingSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return upcomingSortOrder === 'asc' ? valA - valB : valB - valA;
            }
        });

        // Apply pagination
        const startIndex = upcomingPage * FUNCTIONS_PER_PAGE;
        const endIndex = startIndex + FUNCTIONS_PER_PAGE;
        return sorted.slice(startIndex, endIndex);
    }, [stats.upcomingFunctions, upcomingPage, upcomingSortBy, upcomingSortOrder]);

    const totalUpcomingPages = Math.ceil(stats.upcomingFunctions.length / FUNCTIONS_PER_PAGE);

    // Helper to check if monthlyAmounts data has any non-zero values
    const hasMonthlyAmountsData = useMemo(() => {
        return stats.monthlyAmounts.datasets[0].data.length > 0; // Check if there's any data after filtering
    }, [stats.monthlyAmounts.datasets]);


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>डॅशबोर्ड डेटा लोड होत आहे...</Text>
            </View>
        );
    }

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* <Text style={styles.header}> डॅशबोर्ड </Text> */}
        </View>

        {/* Time Range Filters (these affect overall stats, pie chart, upcoming functions) */}
        <View style={styles.filterContainer}>
          {['all_time', 'this_month', 'this_year'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedFilter(filter)}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.selectedFilterButtonText,
                ]}>
                {filter === 'all_time'
                  ? 'सर्वकाळ'
                  : filter === 'this_month'
                    ? 'या महिन्यात'
                    : filter === 'this_year'
                      ? 'या वर्षात'
                      : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stat Cards (affected by selectedFilter) */}
        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('customerlist')}>
            <Text style={styles.cardTitle}>एकूण ग्राहक</Text>
            <Text style={styles.cardValue}>{stats.totalCustomers}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('home')}>
            <Text style={styles.cardTitle}>एकूण उत्पन्न</Text>
            <Text style={styles.amount}>₹{stats.totalAmount.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('customerlist')}>
            <Text style={styles.cardTitle}>आगामी कार्यक्रम</Text>
            <Text style={styles.cardValue}>{stats.upcomingFunctions.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Circular Progress View */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>प्रगती दृश्य</Text>
          <View style={styles.circularProgressContainer}>
            <AnimatedCircularProgress
              size={200}
              width={12}
              fill={stats.totalCustomers > 0 ? (stats.totalCustomers / 300) * 100 : 0}
              tintColor="#2F80ED"
              backgroundColor="#E8E8E8"
              rotation={0}
            >
              {(fill) => (
                <AnimatedCircularProgress
                  size={170}
                  width={12}
                  fill={stats.totalAmount > 0 ? Math.min((stats.totalAmount / 100000) * 100, 100) : 0}
                  tintColor="#27AE60"
                  backgroundColor="#E8E8E8"
                >
                  {() => (
                    <AnimatedCircularProgress
                      size={140}
                      width={12}
                      fill={stats.upcomingFunctions.length > 0 ? (stats.upcomingFunctions.length / 20) * 100 : 0}
                      tintColor="#F39C12"
                      backgroundColor="#E8E8E8"
                    >
                      {() => (
                        <View style={styles.progressCenterContent}>
                          <Text style={styles.progressTotalLabel}>एकूण</Text>
                          <Text style={styles.progressTotalValue}>{stats.totalCustomers}</Text>
                        </View>
                      )}
                    </AnimatedCircularProgress>
                  )}
                </AnimatedCircularProgress>
              )}
            </AnimatedCircularProgress>
          </View>
          
          {/* Legend */}
          <View style={styles.progressLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2F80ED' }]} />
              <Text style={styles.legendText}>ग्राहक</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#27AE60' }]} />
              <Text style={styles.legendText}>उत्पन्न</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F39C12' }]} />
              <Text style={styles.legendText}>कार्यक्रम</Text>
            </View>
          </View>
        </View>

        {/* Pie Chart: Function Types (affected by selectedFilter) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>कार्यक्रमाचे प्रकार</Text>
          {stats.functionTypeDistribution.length > 0 ? (
            <PieChart
              data={stats.functionTypeDistribution}
              width={screenWidth - 15}
              height={250}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              onDataPointClick={({ value, index, getColor }) => {
                const clickedData = stats.functionTypeDistribution[index];
                if (clickedData) {
                  handlePieSlicePress(clickedData);
                }
              }}
            />
          ) : (
            <Text style={styles.noDataText}>
              निवडलेल्या कालावधीसाठी कार्यक्रमाच्या प्रकाराचा डेटा नाही.
            </Text>
          )}
        </View>

       
        {/* Bar Chart: Monthly Amounts (Conditional Rendering) */}
        {hasMonthlyAmountsData ? ( // Use hasMonthlyAmountsData here
          <View style={styles.section}>
            <View style={styles.barChartHeader}>
              <Text style={styles.sectionTitle}>मासिक उत्पन्न</Text>
              {/* Year Filter for Bar Chart */}
              <View style={styles.yearFilterContainer}>
                <Text style={styles.yearFilterLabel}>वर्ष निवडा:</Text>
                <Picker
                  selectedValue={selectedBarChartYear}
                  style={styles.yearPicker}
                  onValueChange={(itemValue) => setSelectedBarChartYear(itemValue)}>
                  {availableBarChartYears.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                  ))}
                </Picker>
              </View>
            </View>
            <BarChart
              data={stats.monthlyAmounts} // This now contains only non-zero bars
              width={screenWidth - 50}
              height={250}
              // yAxisLabel="₹"
              chartConfig={{
                ...chartConfig,
                formatYLabel: (value) => `₹${parseInt(value).toLocaleString('en-IN')}`,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              onDataPointClick={({ value, index }) => {
                handleBarPress(value, index);
              }}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.barChartHeader}>
              <Text style={styles.sectionTitlemonthly}>मासिक उत्पन्न वितरण</Text>
              {/* Year Filter for Bar Chart */}
              <View style={styles.yearFilterContainer}>
                <Text style={styles.yearFilterLabel}>वर्ष निवडा:</Text>
                <Picker
                  selectedValue={selectedBarChartYear}
                  style={styles.yearPicker}
                  onValueChange={(itemValue) => setSelectedBarChartYear(itemValue)}>
                  {availableBarChartYears.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                  ))}
                </Picker>
              </View>
            </View>
            <Text style={styles.noDataText}>निवडलेल्या वर्षासाठी मासिक उत्पन्नाचा डेटा नाही.</Text>
          </View>
        )}

        {/* Upcoming Functions Table (affected by selectedFilter) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>आगामी कार्यक्रम</Text>
          <View style={styles.sortFilterContainer}>
            <Text style={styles.sortLabel}>क्रमवारी लावा:</Text>
            <Picker
              selectedValue={upcomingSortBy}
              style={styles.pickerStyle}
              onValueChange={(itemValue) => setUpcomingSortBy(itemValue)}>
              <Picker.Item label="दिनांक" value="date" />
              <Picker.Item label="प्रकार" value="type" />
              <Picker.Item label="रक्कम" value="amount" />
            </Picker>
            <TouchableOpacity
              onPress={() => setUpcomingSortOrder(upcomingSortOrder === 'asc' ? 'desc' : 'asc')}
              style={styles.sortOrderButton}>
              <Feather
                name={upcomingSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                size={20}
                color="#2F80ED"
              />
            </TouchableOpacity>
          </View>

          {stats.upcomingFunctions.length > 0 ? (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2 }]}>नाव</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>प्रकार</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>दिनांक</Text>
                <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>रक्कम</Text>
              </View>
              {sortedAndPaginatedUpcomingFunctions.map((func, i) => (
                <View key={func.id || i} style={styles.tableRow}>
                  <Text style={[styles.cell, { flex: 2 }]}>{func.fullName}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{func.functionType}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{func.functionDate}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>
                    ₹{parseFloat(func.totalAmount).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
              {/* Pagination Controls */}
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={styles.paginationButton}
                  onPress={() => setUpcomingPage((prev) => Math.max(0, prev - 1))}
                  disabled={upcomingPage === 0}>
                  <Text style={styles.paginationButtonText}>मागे</Text>
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {upcomingPage + 1} / {totalUpcomingPages || 1}
                </Text>
                <TouchableOpacity
                  style={styles.paginationButton}
                  onPress={() =>
                    setUpcomingPage((prev) => Math.min(totalUpcomingPages - 1, prev + 1))
                  }
                  disabled={upcomingPage >= totalUpcomingPages - 1}>
                  <Text style={styles.paginationButtonText}>पुढे</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>या कालावधीत आगामी कार्यक्रम नाहीत.</Text>
          )}
        </View>

        {/* Drill Down Modal */}
        <DrillDownModal
          visible={drillDownModalVisible}
          onClose={() => setDrillDownModalVisible(false)}
          title={drillDownTitle}
          data={drillDownData}
        />
      </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        fontSize: 18,
        color: '#555',
    },
    headerContainer: {
        marginBottom: 10,
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F80ED',
    },
    barChartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10, // Adjust spacing as needed
        paddingHorizontal: 5, // Small padding to align with chart better
    },
    yearFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    yearFilterLabel: {
        fontSize: 14,
        color: '#4F4F4F',
    },
    yearPicker: {
        width: 120, // Adjust width as needed
        height: 50,
        // backgroundColor: '#e0e0e0', // Add a subtle background
        borderRadius: 5,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    selectedFilterButton: {
        backgroundColor: '#2F80ED',
    },
    filterButtonText: {
        color: '#333',
        fontSize: 13,
        fontWeight: '500',
    },
    selectedFilterButtonText: {
        color: '#fff',
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        width: '30%',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100, // Ensure consistent height
    },
    cardTitle: {
        fontSize: 14,
        color: '#4F4F4F',
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2F80ED',
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27AE60', // Green for revenue
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F80ED',
    },
    sectionTitlemonthly:{
      fontSize: 18,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginRight:20
    },
    chart: {
        borderRadius: 16,
        width: '90%',
    },
    sortFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        padding: 8,
    },
    sortLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 8,
        color: '#4F4F4F',
    },
    pickerStyle: {
        flex: 1,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    sortOrderButton: {
        padding: 8,
        marginLeft: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e0f2f7', // Lighter blue for header
        padding: 10,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#2F80ED',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    cell: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
    },
    noDataText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 20,
        fontStyle: 'italic',
        fontSize: 14,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    paginationButton: {
        backgroundColor: '#2F80ED',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    paginationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    pageText: {
        fontSize: 14,
        color: '#555',
        fontWeight: 'bold',
    },
    // Drill Down Modal Styles
    drillDownModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    drillDownModalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '90%',
        maxHeight: '70%',
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    drillDownModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    drillDownModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F80ED',
    },
    drillDownCloseIcon: {
        padding: 5,
    },
    drillDownItem: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 5,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    drillDownItemText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 2,
    },
    circularProgressContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
      },
      progressCenterContent: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      progressTotalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
      },
      progressTotalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
      },
      progressLegend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
      },
      legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 5,
      },
      legendText: {
        fontSize: 12,
        color: '#666',
      },
});

export default Dashboard;