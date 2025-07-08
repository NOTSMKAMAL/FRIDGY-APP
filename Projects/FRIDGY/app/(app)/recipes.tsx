import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React, { memo } from 'react';
import { Pressable, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const RecipeCard = memo(function RecipeCard({ recipe }: { recipe: any }) {
  return (
  <View
    style={{
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: '#E0E0E0',
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 24 }}>{recipe.emoji}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#333',
        marginBottom: 4 
      }}>
        {recipe.name}
      </Text>
      <Text style={{ 
        fontSize: 13, 
        color: '#666',
        fontWeight: '400' 
      }}>
        {recipe.cookTime} • {recipe.difficulty}
      </Text>
    </View>
  </View>
  );
});

export default function Recipes() {
  const router = useRouter();
  const auth = getAuth();
  const { width, height } = useWindowDimensions();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  const mockRecipes = [
    { id: 1, name: 'Pasta Carbonara', cookTime: '20 min', difficulty: 'Easy', emoji: '🍝' },
    { id: 2, name: 'Chicken Stir Fry', cookTime: '15 min', difficulty: 'Medium', emoji: '🥘' },
    { id: 3, name: 'Caesar Salad', cookTime: '10 min', difficulty: 'Easy', emoji: '🥗' },
    { id: 4, name: 'Beef Tacos', cookTime: '25 min', difficulty: 'Medium', emoji: '🌮' },
    { id: 5, name: 'Chocolate Cake', cookTime: '45 min', difficulty: 'Hard', emoji: '🍰' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#702963', '#B39DDB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: width, height: height }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={handleLogout}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: 'rgba(255,255,255,0.9)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            zIndex: 10,
          }}
        >
          <Text style={{ color: '#702963', fontWeight: '600', fontSize: 14 }}>Sign Out</Text>
        </Pressable>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 80, paddingBottom: 20 }}
        >
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '600', 
            color: 'white', 
            marginBottom: 30,
            textAlign: 'center',
            letterSpacing: 0.3,
            fontFamily: 'System' 
          }}>
            Recipes
          </Text>

          <View style={{ marginBottom: 20 }}>
            <Pressable
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <Text style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 15,
                fontWeight: '400' 
              }}>
                Search recipes...
              </Text>
            </Pressable>
          </View>

          {mockRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}

          <Text style={{ 
            fontSize: 15, 
            color: 'rgba(255,255,255,0.8)', 
            textAlign: 'center',
            marginTop: 20,
            fontWeight: '400' 
          }}>
            More recipes coming soon!
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
