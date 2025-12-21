import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { auth, db } from '../firebase/config';
import { getFavorites, removeFavorite } from '../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(0);

  useEffect(() => {
    return () => {
      // restore tab bar on unmount
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
    };
  }, []);

  const loadFavorites = async () => {
    if (!refreshing) setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setWorks([]);
        return;
      }
      const favs = await getFavorites(user.uid);
      if (!Array.isArray(favs) || favs.length === 0) {
        setWorks([]);
        return;
      }

      const promises = favs.map(async (id) => {
        // Try Open Library first
        try {
          const res = await fetch(`https://openlibrary.org/works/${id}.json`);
          if (res.ok) {
            const data = await res.json();
            const coverId = data.covers && data.covers.length ? data.covers[0] : null;
            const cover = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
            return { id, title: data.title || 'Untitled', cover };
          }
        } catch (e) {
          // fallthrough to try customBooks
        }

        // If Open Library failed, try customBooks collection
        try {
          const cbRef = doc(db, 'customBooks', id);
          const snap = await getDoc(cbRef);
          if (snap.exists()) {
            const d = snap.data();
            return { id, title: d.title || 'Untitled', cover: d.coverUrl || null };
          }
        } catch (e) {
          // ignore
        }

        return { id, title: id, cover: null };
      });

      const results = await Promise.all(promises);
      setWorks(results);
    } catch (e) {
      console.warn('Error loading favorites', e);
      setWorks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  // Reload when screen is focused to reflect external updates
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - (scrollY.current || 0);
    scrollY.current = y;
    if (dy > 6) {
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'none' } }); } catch (e) {}
    } else if (dy < -6) {
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
    }
  };

  const handleRemove = async (workId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await removeFavorite(user.uid, workId);
      setWorks((prev) => prev.filter((w) => w.id !== workId));
    } catch (e) {
      console.warn('Remove favorite error', e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Pressable onPress={() => navigation.navigate('BookDetail', { workId: item.id })} style={styles.left}>
        {item.cover ? (
          <Image source={{ uri: item.cover }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.placeholder]}><Text style={{ color: '#666' }}>No cover</Text></View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => handleRemove(item.id)} style={styles.action}>
        <Ionicons name="heart" size={22} color="#ef4444" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      )}

      <FlatList
        data={works}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingTop: 24, flexGrow: 1 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={() => (
          <View style={styles.center}><Text>Vous n'avez pas encore de favoris.</Text></View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cover: { width: 70, height: 100, borderRadius: 6, backgroundColor: '#eee' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  action: { padding: 8 },
});