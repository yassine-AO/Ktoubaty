import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  TextInput,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase/config';
import { getUserData, setFavoriteGenres } from '../firebase/firestore';
import { logOut } from '../firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const scrollY = useRef(0);

  useEffect(() => {
    return () => {
      // restore tab bar
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
    };
  }, []);
  const availableGenres = ['Fiction','Romance','Mystery','Fantasy','History','Science Fiction','Poetry','Biography','Children','Art','Science','Philosophy','Religion','Education','Crime','Thriller','Young Adult','Nonfiction','Cooking','Travel'];

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const fetchUserData = async () => {
    try {
      if (auth.currentUser) {
        const data = await getUserData(auth.currentUser.uid);
        setUserData({
          ...data,
          email: auth.currentUser.email,
          displayName: data?.displayName || auth.currentUser.displayName || 'User'
        });
        // initialize selected genres from user data
        setSelectedGenres((data && data.favoriteGenres) || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Toggle a genre selection locally
  const toggleGenre = (genre) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      return [...prev, genre];
    });
  };

  const handleSaveGenres = async () => {
    try {
      const uid = auth.currentUser.uid;
      await setFavoriteGenres(uid, selectedGenres);
      // refresh local user data
      const data = await getUserData(uid);
      setUserData({ ...data, email: auth.currentUser.email, displayName: data?.displayName || auth.currentUser.displayName || 'User' });
      Alert.alert('Saved', 'Favorite genres updated');
    } catch (e) {
      console.warn('Error saving genres', e);
      Alert.alert('Error', 'Failed to save genres');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF385C" />
      </SafeAreaView>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const dy = y - (scrollY.current || 0);
          scrollY.current = y;
          if (dy > 6) {
            try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'none' } }); } catch (e) {}
          } else if (dy < -6) {
            try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
          }
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(userData?.displayName || userData?.email)}
            </Text>
          </View>
          <Text style={styles.userName}>
            {userData?.displayName || 'User'}
          </Text>
          {userData?.displayName && userData.displayName.includes(' ') && (
            <Text style={styles.userDetails}>
              {userData.displayName.split(' ')[0]} • {userData.displayName.split(' ')[1]}
            </Text>
          )}
          <Text style={styles.userEmail}>
            {userData?.email || 'Not available'}
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            Profile Information
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>
                  {userData?.email || 'Not available'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#667eea" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {userData?.createdAt 
                    ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not available'
                  }
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="heart-outline" size={20} color="#667eea" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Favorite Books</Text>
                <Text style={styles.infoValue}>
                  {userData?.favorites?.length || 0} books saved
                </Text>
              </View>
            </View>
          </View>

          {userData?.favoriteGenres && userData.favoriteGenres.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="book-outline" size={20} color="#667eea" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Favorite Genres</Text>
                  <View style={styles.genresListEditable}>
                    {availableGenres.map((genre) => {
                      const selected = selectedGenres.includes(genre);
                      return (
                        <TouchableOpacity key={genre} onPress={() => toggleGenre(genre)} style={[styles.genreSelectable, selected ? styles.genreSelected : null]} activeOpacity={0.85}>
                          <Text style={[styles.genreTagText, selected ? styles.genreSelectedText : null]}>{genre}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={styles.addGenreButton} onPress={handleSaveGenres} activeOpacity={0.9}>
                      <Text style={styles.addGenreText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc'
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#667eea',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  genresListEditable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  genreEditable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 8,
  },
  removeGenreButton: { marginLeft: 8, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addGenreRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  genreInput: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  addGenreButton: { backgroundColor: '#667eea', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addGenreText: { color: '#fff', fontWeight: '700' },
  genreSelectable: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e6eef8' },
  genreSelected: { backgroundColor: '#667eea', borderColor: '#667eea' },
  genreSelectedText: { color: '#fff' },
  genreTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  genreTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 8,
  },
});