import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addFavorite } from '../firebase/firestore';

export default function CreateBookScreen({ navigation, route }) {
  const prefill = (route.params && route.params.title) || '';
  const [title, setTitle] = useState(prefill);
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre pour le livre.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Non connecté', 'Vous devez être connecté pour créer un livre.');
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'customBooks'), {
        owner: user.uid,
        title: title.trim(),
        author: author.trim() || null,
        coverUrl: coverUrl.trim() || null,
        createdAt: serverTimestamp(),
      });

      // add to user favorites
      await addFavorite(user.uid, docRef.id);

      Alert.alert('Créé', "Le livre a été créé et ajouté à vos favoris.");
      navigation.navigate('Favorites');
    } catch (e) {
      console.warn('Create custom book error', e);
      Alert.alert('Erreur', 'Impossible de créer le livre.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Titre</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Titre du livre" />

      <Text style={styles.label}>Auteur (optionnel)</Text>
      <TextInput value={author} onChangeText={setAuthor} style={styles.input} placeholder="Auteur" />

      <Text style={styles.label}>URL de couverture (optionnel)</Text>
      <TextInput value={coverUrl} onChangeText={setCoverUrl} style={styles.input} placeholder="https://..." />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer et ajouter aux favoris</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 15 },
  saveButton: { marginTop: 18, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
