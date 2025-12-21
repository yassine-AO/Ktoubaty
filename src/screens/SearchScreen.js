import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const buildWorkFromDoc = (d) => ({ id: (d.key || '').replace('/works/', ''), title: d.title, coverId: d.cover_i || null });

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const performSearch = async (q) => {
    const qtrim = (q || '').trim();
    if (!qtrim) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(qtrim)}&limit=80`);
      if (!res.ok) {
        setResults([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const docs = (json.docs || []).map(buildWorkFromDoc).filter((w) => w.coverId);
      setResults(docs);
    } catch (e) {
      console.warn('Search error', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (text) => {
    setQuery(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => performSearch(text), 450);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    const cover = item.coverId ? `https://covers.openlibrary.org/b/id/${item.coverId}-M.jpg` : null;
    return (
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('BookDetail', { workId: item.id })}>
        {cover ? <View style={styles.thumbWrap}><Image source={{ uri: cover }} style={styles.thumb} /></View> : <View style={[styles.thumbWrap, styles.thumbPlaceholder]}><Text>No</Text></View>}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={2} style={styles.resultTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
        <TextInput value={query} onChangeText={onChange} placeholder="Rechercher des livres..." style={styles.searchInput} returnKeyType="search" />
        {loading ? <ActivityIndicator style={{ marginRight: 12 }} /> : query ? <TouchableOpacity onPress={clear} style={{ marginRight: 12 }}><Text style={{ color: '#2563eb', fontWeight: '700' }}>Effacer</Text></TouchableOpacity> : null}
      </View>

      {query && !loading && results.length === 0 ? (
        <TouchableOpacity style={styles.createSuggest} onPress={() => navigation.navigate('CreateBook', { title: query })}>
          <Text style={styles.createSuggestText}>Créer "{query}"</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList data={results} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ padding: 12 }} ListEmptyComponent={() => !query ? <View style={styles.center}><Text>Entrez un terme pour rechercher des livres.</Text></View> : loading ? <View style={styles.center}><ActivityIndicator /></View> : <View style={styles.center}><Text>Aucun résultat.</Text></View>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', margin: 12, borderRadius: 12, height: 48 },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 16, height: 48 },
  createSuggest: { marginHorizontal: 12, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  createSuggestText: { color: '#0b1724', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  thumbWrap: { width: 56, height: 80, borderRadius: 6, overflow: 'hidden', backgroundColor: '#eef2ff' },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 8, color: '#666' },
});
