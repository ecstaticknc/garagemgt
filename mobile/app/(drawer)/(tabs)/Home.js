import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing } from 'react-native';
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
          
          <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
            <Icon name="tools" size={40} color="#fff" />
          </Animated.View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loadingInfo ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading service center information...
            </Text>
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
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceCenterName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
  },
  iconContainer: {
    marginLeft: 16,
    padding: 8,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardContent: {
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  errorCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginLeft: 12,
    fontSize: 15,
  },
  noInfoContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noInfoText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
});