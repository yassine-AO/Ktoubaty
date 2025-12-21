import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData } from '../firebase/firestore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const genreToSlug = (g) => g.toLowerCase().replace(/\s+/g, '_');

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feed, setFeed] = useState([]); // combined list of works to display full-screen
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatRef = useRef(null);
  const { width } = Dimensions.get('window');
  const numColumns = 2;
  const CARD_MARGIN = 12;
  const CARD_WIDTH = Math.floor((width - CARD_MARGIN * (numColumns + 1)) / numColumns);
  const CARD_IMAGE_HEIGHT = 200;
  const GENRE_CARD_GAP = 10;
  const GENRE_CARD_WIDTH = Math.floor((width - 24 - GENRE_CARD_GAP) / 2); // 2 per row in genre
  const [genreSections, setGenreSections] = useState([]); // [{ genre, works: [] }]
  const [allWorks, setAllWorks] = useState([]);
  const scrollY = useRef(0);
  const [showTopBar, setShowTopBar] = useState(true);

  const fetchInitialFeed = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setFeed([]);
        return;
      }
      const data = await getUserData(user.uid);
      const favGenres = (data && data.favoriteGenres) || [];

      // If user has favorite genres, fetch works from those genres and merge.
      // Otherwise use a popular subject fallback.
      const genres = favGenres.length ? favGenres : ['fiction'];
      const limitPerGenre = 8;
      const promises = genres.map(async (g) => {
        const slug = genreToSlug(g);
        const res = await fetch(`https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limitPerGenre}`);
        if (!res.ok) return [];
        const json = await res.json();
        // map and only keep works that have a cover (cover_id or covers array)
        return (json.works || [])
          .map((w) => {
            const coverId = (w.covers && w.covers.length && w.covers[0]) || w.cover_id || null;
            return { id: (w.key || '').replace('/works/', ''), title: w.title, coverId };
          })
          .filter((x) => x.coverId);
      });

      const results = await Promise.all(promises);
      // build per-genre sections and a merged feed
      const sections = genres.map((g, idx) => ({ genre: g, works: (results[idx] || []) }));
      setGenreSections(sections);

      // flatten and dedupe for merged preview (not used as main grid)
      const merged = [];
      const seen = new Set();
      results.flat().forEach((w) => {
        if (!w || !w.coverId) return; // require cover
        if (!seen.has(w.id)) {
          seen.add(w.id);
          merged.push(w);
        }
      });

      // Fetch a separate 'All Books' list by aggregating multiple popular subjects
      try {
        const desiredMax = 200; // max number of books to fetch for All Books
        let allAccum = [];
        const subjects = ['fiction','romance','mystery','fantasy','history','science_fiction','poetry','biography','children','travel','art','science','philosophy','religion','education','crime','thriller','young_adult'];

        for (const subj of subjects) {
          if (allAccum.length >= desiredMax) break;
          try {
            const sres = await fetch(`https://openlibrary.org/subjects/${encodeURIComponent(subj)}.json?limit=40`);
            if (!sres.ok) continue;
            const sjson = await sres.json();
            const works = (sjson.works || [])
              .map((w) => ({ id: (w.key || '').replace('/works/', ''), title: w.title, coverId: (w.covers && w.covers[0]) || null }))
              .filter((x) => x.coverId);
            for (const w of works) {
              if (!allAccum.find((a) => a.id === w.id)) allAccum.push(w);
              if (allAccum.length >= desiredMax) break;
            }
          } catch (e) {
            // ignore subject error and continue
          }
        }

        // Fallback: if still not enough, try a generic search query
        if (allAccum.length < 30) {
          try {
            const qLimit = 100;
            const s = await fetch(`https://openlibrary.org/search.json?q=the&limit=${qLimit}&offset=0`);
            if (s.ok) {
              const sj = await s.json();
              const docs = (sj.docs || []).map((d) => ({ id: (d.key || '').replace('/works/', ''), title: d.title, coverId: d.cover_i || null })).filter((x) => x.coverId);
              for (const d of docs) {
                if (!allAccum.find((a) => a.id === d.id)) allAccum.push(d);
                if (allAccum.length >= desiredMax) break;
              }
            }
          } catch (e) {
            // ignore
          }
        }

        if (allAccum.length) {
          setAllWorks(allAccum);
          setFeed(allAccum);
        } else {
          setAllWorks(merged);
          setFeed(merged);
        }
      } catch (e) {
        console.warn('Error loading all works', e);
        setAllWorks(merged);
        setFeed(merged);
      }
      setPage(0);
    } catch (e) {
      console.warn('Error loading feed', e);
      setFeed([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search is handled in SearchScreen; HomeScreen shows discovery grid only

  useEffect(() => {
    // fetch once on mount, and also refetch on auth state changes
    fetchInitialFeed();
    const unsub = onAuthStateChanged(auth, () => {
      fetchInitialFeed();
    });
    return () => {
      // restore tab bar visibility when leaving screen
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
      unsub();
    };
  }, []);

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - (scrollY.current || 0);
    scrollY.current = y;
    if (dy > 6) {
      // scrolling down -> hide top bar and bottom tab
      if (showTopBar) setShowTopBar(false);
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'none' } }); } catch (e) {}
    } else if (dy < -6) {
      // scrolling up -> show
      if (!showTopBar) setShowTopBar(true);
      try { navigation.getParent()?.setOptions({ tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: '#ffffff', borderRadius: 18, height: 72, paddingVertical: 6, borderTopWidth: 0, elevation: 14, shadowColor: '#0b1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, alignItems: 'center', display: 'flex' } }); } catch (e) {}
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInitialFeed();
  };

  const fetchMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // load next page of global search as fallback; page * limit offset
      const limit = 10;
      const res = await fetch(`https://openlibrary.org/search.json?limit=${limit}&offset=${(page + 1) * limit}`);
      if (!res.ok) return;
      const json = await res.json();
      const more = (json.docs || []).map((d) => ({ id: (d.key || '').replace('/works/', ''), title: d.title, coverId: d.cover_i || null }));

      // dedupe
      const seen = new Set(feed.map((f) => f.id));
      const filtered = more.filter((m) => !seen.has(m.id));
      setFeed((prev) => [...prev, ...filtered]);
      setPage((p) => p + 1);
    } catch (e) {
      console.warn('Error fetching more feed', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderFullItem = ({ item }) => {
    // Grid card representation
    const cover = item.coverId ? `https://covers.openlibrary.org/b/id/${item.coverId}-M.jpg` : null;
    const wrapperStyle = { width: CARD_WIDTH, marginLeft: CARD_MARGIN, marginBottom: CARD_MARGIN };
    const imageStyle = { width: '100%', height: CARD_IMAGE_HEIGHT };
    return (
      <TouchableOpacity style={[styles.cardWrap, wrapperStyle]} onPress={() => navigation.navigate('BookDetail', { workId: item.id })} activeOpacity={0.85}>
        {cover ? (
          <Image source={{ uri: cover }} style={[styles.cardImage, imageStyle]} />
        ) : (
          <View style={[styles.cardImage, imageStyle, styles.placeholder]}>
            <Text style={styles.placeholderText}>No cover</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const key = `grid_${numColumns}`;
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatRef}
        data={feed}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280' }}>Aucun livre trouvé pour le moment.</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.genreContainer}>
            <Text style={styles.genreHeader}>Genres préférés</Text>
            <FlatList
              data={genreSections}
              keyExtractor={(g) => g.genre}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreScroll}
              renderItem={({ item }) => (
                <View style={[styles.genreBlock, { width: width - 24 }]}> 
                  <Text style={styles.genreTitle}>{item.genre}</Text>
                  <FlatList
                    data={item.works}
                    keyExtractor={(w) => w.id}
                    numColumns={2}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                    contentContainerStyle={{ paddingBottom: 6 }}
                    renderItem={({ item: w }) => {
                      const cover = w.coverId ? `https://covers.openlibrary.org/b/id/${w.coverId}-M.jpg` : null;
                      return (
                        <TouchableOpacity style={[styles.smallCardWrap, { width: GENRE_CARD_WIDTH, marginRight: GENRE_CARD_GAP }]} onPress={() => navigation.navigate('BookDetail', { workId: w.id })} activeOpacity={0.9}>
                          {cover ? (
                            <Image source={{ uri: cover }} style={[styles.smallCover, { height: 140 }]} />
                          ) : (
                            <View style={[styles.smallCover, styles.placeholder, { height: 140 }]}>
                              <Text style={styles.placeholderText}>No cover</Text>
                            </View>
                          )}
                          <Text style={styles.smallTitle} numberOfLines={2}>{w.title}</Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}
            />
            <View style={styles.allHeaderWrap}>
              <Text style={styles.allHeader}>All Books</Text>
            </View>
          </View>
        )}
        renderItem={renderFullItem}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={fetchMore}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.6}
        contentContainerStyle={styles.gridContainer}
        ListFooterComponent={loadingMore ? <View style={{ padding: 12 }}><ActivityIndicator /></View> : null}
        key={key}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7fb' },
  gridContainer: { paddingTop: 18, paddingBottom: 24, paddingHorizontal: 0 },
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  columnWrapper: { justifyContent: 'space-between' },
  cardWrap: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#0b1724', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 3 },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover', backgroundColor: '#eef2ff' },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', lineHeight: 18 },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2ff' },
  placeholderText: { color: '#8b93a7' },
  genreContainer: { paddingVertical: 12, paddingLeft: 12, paddingRight: 6, backgroundColor: 'transparent' },
  genreHeader: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  genreScroll: { paddingRight: 12 },
  genreBlock: { marginRight: 12, width: 220 },
  genreTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  smallWrap: { marginRight: 8 },
  smallCardWrap: { width: 120, marginRight: 10, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', paddingBottom: 8, shadowColor: '#0b1724', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 3 },
  smallCover: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#eef2ff' },
  smallTitle: { paddingHorizontal: 8, paddingTop: 8, fontSize: 13, fontWeight: '700', color: '#0f172a', lineHeight: 17 },
  allHeaderWrap: { paddingHorizontal: 12, marginTop: 12, marginBottom: 8 },
  allHeader: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerTop: { paddingTop: 28, paddingBottom: 6, backgroundColor: 'transparent' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 6, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1 },
  clearButton: { marginLeft: 8 },
  clearText: { color: '#2563eb', fontWeight: '700' },
  createSuggest: { marginHorizontal: 12, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 10 },
  createSuggestText: { color: '#0b1724', fontWeight: '700' },
});
