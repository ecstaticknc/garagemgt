import React, { useEffect, useState ,useRef, } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView,Animated,Easing} from 'react-native';
import { List, Divider, Text, Card, useTheme } from 'react-native-paper';
import { useAuth } from '../../../context/AuthContext';
import API from '../../config/axiosInstance';
import { useNavigation, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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


  useEffect(() => {
    const fetchServiceCenterData = async () => {
      if (userScId) {
        try {
          setLoadingInfo(true);
          setErrorInfo(null);
          const response = await API._get(`/servicecenters/${userScId}`);
          console.log("Service Center Data:", response.data.data); 
          setServiceCenterInfo(response.data.data);
        } catch (error) {
          console.error("Failed to fetch service center data for dashboard:", error);
          setErrorInfo("Failed to load service center details.");
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
    inputRange: [0, 3],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Gradient */}
      <LinearGradient
        colors={[colors.primary, '#611cb']}
        start={{ x: 2, y: 1 }}
        end={{ x: 3, y: 5 }}
        style={styles.header}
      >
        
        <View style={styles.headerTextContainer}>
  <Text style={styles.welcomeText}>Welcome</Text>
  <Text style={styles.headerTitle}>Service Center Dashboard</Text>
</View>
<Animated.View style={{ transform: [{ rotate: spin }] }}>
  <Icon name="tools" size={40} color="#fff" style={styles.headerIcon} />
</Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {loadingInfo ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.text }}>Loading your information...</Text>
          </View>
        ) : errorInfo ? (
          <Card style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Card.Content style={styles.errorContent}>
              <Icon name="alert-circle" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorInfo}</Text>
            </Card.Content>
          </Card>
        ) : serviceCenterInfo ? (
          <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.06)']}
              style={styles.cardGradient}
            />
            <Card.Title
  title={serviceCenterInfo.proprietorName}
  titleStyle={[styles.cardTitle, { color: colors.primary }]}
  subtitle={serviceCenterInfo.serviceCenterName}
  subtitleStyle={styles.cardSubtitle}
  left={(props) => <List.Icon {...props} icon="account-tie" color={colors.primary} />}
/>
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
          <View style={styles.noInfoContent}>
            <Icon name="information" size={30} color={colors.primary} />
            <Text style={[styles.noInfoText, { color: colors.text }]}>
              No service center data available.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 30,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcon: {
    marginRight: 10,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  infoCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  cardContent: {
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  errorCard: {
    borderRadius: 12,
    marginBottom: 20,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  errorText: {
    marginLeft: 10,
    fontSize: 15,
  },
  noInfoContent: {
    alignItems: 'center',
    padding: 20,
  },
  noInfoText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  headerTextContainer: {
  flex: 1,
},

welcomeText: {
  fontSize: 24,
  color: '#fff',
  fontWeight: 'bold',
 
  marginBottom: 4,
  textAlign: 'center',
},

headerTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
},
});
