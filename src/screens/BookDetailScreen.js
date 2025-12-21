import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { auth, db } from '../firebase/config';
import { addFavorite, removeFavorite, getFavorites } from '../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function BookDetailScreen({ route, navigation }) {
  const { workId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [work, setWork] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadWork = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      if (!workId) return;
      let data = null;
      let isCustom = false;

      // Try Open Library
      try {
        const res = await fetch(`https://openlibrary.org/works/${workId}.json`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        // ignore and fallback
      }

      // If Open Library failed, try customBooks
      if (!data) {
        try {
          const cbRef = doc(db, 'customBooks', workId);
          const snap = await getDoc(cbRef);
          if (snap.exists()) {
            const d = snap.data();
            data = { title: d.title || 'Untitled', description: d.description || null, covers: d.coverUrl ? [d.coverUrl] : null, _custom: true, _owner: d.owner };
            isCustom = true;
          }
        } catch (e) {
          // ignore
        }
      }

      // Fetch author details if available (only for Open Library responses)
      let authors = [];
      if (data && !isCustom && Array.isArray(data.authors) && data.authors.length) {
        const authPromises = data.authors.map(async (a) => {
          const key = a.author?.key || a.key || a.author;
          if (!key) return { key: null, name: null };
          const urlKey = key.startsWith('/authors/') ? key : `/authors/${key}`;
          try {
            const ar = await fetch(`https://openlibrary.org${urlKey}.json`);
            if (!ar.ok) return { key: urlKey, name: null };
            const ad = await ar.json();
            return { key: urlKey, name: ad.name || ad.personal_name || null };
          } catch (e) {
            return { key: urlKey, name: null };
          }
        });
        authors = await Promise.all(authPromises);
      }

      setWork({ ...data, _authors: authors });

      // check favorite
      const user = auth.currentUser;
      if (user) {
        const favs = await getFavorites(user.uid);
        setIsFavorite(Array.isArray(favs) && favs.includes(workId));
      }
    } catch (e) {
      console.warn('Error loading work', e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    let mounted = true;
    if (mounted) loadWork();
    return () => { mounted = false; };
  }, [loadWork]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWork(true);
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      // could navigate to login or show message
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(user.uid, workId);
        setIsFavorite(false);
      } else {
        await addFavorite(user.uid, workId);
        setIsFavorite(true);
      }
    } catch (e) {
      console.warn('Favorite toggle error', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!work) {
    return (
      <View style={styles.center}>
        <Text>Impossible de charger le livre.</Text>
      </View>
    );
  }

  const coverCandidate = work.covers && work.covers.length ? work.covers[0] : null;
  let cover = null;
  if (coverCandidate) {
    if (typeof coverCandidate === 'string' && (coverCandidate.startsWith('http://') || coverCandidate.startsWith('https://'))) {
      cover = coverCandidate;
    } else {
      cover = `https://covers.openlibrary.org/b/id/${coverCandidate}-L.jpg`;
    }
  }
  const created = work.created && (work.created.value || work.created);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{work.title}</Text>
        <Pressable onPress={toggleFavorite} style={{ padding: 8 }}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={28} color={isFavorite ? '#e11d48' : '#374151'} />
        </Pressable>
      </View>

      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Text style={styles.placeholderText}>No cover</Text>
        </View>
      )}

      <View style={styles.card}>
        {work.description ? (
          <Text style={styles.description}>{typeof work.description === 'string' ? work.description : work.description.value}</Text>
        ) : null}

        <View style={styles.metaRow}>
          {work.first_publish_date ? <Text style={styles.meta}>Published: {work.first_publish_date}</Text> : null}
          {created ? <Text style={styles.meta}> · Created: {new Date(created).toLocaleDateString()}</Text> : null}
        </View>

        {work._authors && work._authors.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Authors</Text>
            {work._authors.map((a, i) => (
              <Text key={i} style={styles.section}>{a.name || a.key}</Text>
            ))}
          </View>
        ) : null}

        {work.subjects && work.subjects.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.chipsRow}>
              {work.subjects.slice(0, 12).map((s, i) => (
                <View key={i} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
              ))}
            </View>
          </View>
        ) : null}

        {work.excerpts && work.excerpts.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Excerpts</Text>
            {work.excerpts.map((ex, i) => (
              <Text key={i} style={styles.section}>{ex.comment ? `${ex.comment}: ` : ''}{ex.excerpt || (ex.text && ex.text) || JSON.stringify(ex)}</Text>
            ))}
          </View>
        ) : null}

        {work.links && work.links.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Links</Text>
            {work.links.map((l, i) => (
              <Text key={i} style={styles.link}>{l.title || l.url}</Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 8 },
  cover: { width: '100%', height: 360, resizeMode: 'cover', borderRadius: 6, backgroundColor: '#eee', marginTop: 12 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  section: { fontSize: 14, color: '#111', lineHeight: 20 },
  description: { fontSize: 15, color: '#111', lineHeight: 22 },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  card: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 12, color: '#111' },
  link: { color: '#2563eb', textDecorationLine: 'underline', marginBottom: 6 },
});
