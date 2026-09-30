import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <View style={styles.header}>
          <Feather name="shield" size={42} color="#6a1b9a" />
          <Text style={styles.logo}>SaferMzansi</Text> 
        </View>

        <View style={styles.SafetyArea}>
          <View style={styles.firstCircle}/>
          <View style={styles.secondCircle}/>
          <View style={styles.secondCircle}/>
          <View style={styles.circleIcon}>
            <Feather name='shield' size={48} color='#ffffff' />
          </View>

          <View style={[styles.topleftIcon, styles.iconCircle]}>
            <Feather name="lock" size={28} color="#000000" />
          </View>
          <View style={[styles.bottomleftIcon, styles.iconCircle ]}>
            <Feather name="user-plus" size={28} color="#000000"  />
          </View>
          <View style={[styles.toprightIcon, styles.iconCircle]}>
            <Feather name="map-pin" size={28} color="#000000" />
          </View>
          <View style={[styles.bottomrightIcon, styles.iconCircle]}>
            <Feather name='alert-circle' size={28} color= "#000000"/>
          </View>

        </View>

        <View style={styles.bottomTabs}>
          <TouchableOpacity style={styles.Tab} 
            onPress={() => navigation.navigate('EmergencyContactScreen')}
          >
            <Feather name="user" size={28} color="#000000" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.Tab}
            onPress={() => navigation.navigate('VaultScreen')}
          >
            <Feather name="archive" size={28} color="#000000" />
            <Text style={styles.navText}>Vault</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.Tab}
            onPress={() => navigation.navigate('SupportHubScreen')}
          >
            <Feather name="heart" size={28} color="#000000" />
            <Text style={styles.navText}>Hub</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.Tab}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <Feather name="settings" size={28} color="#000000" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>

        </View>
      </View>
      
       
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8eeff',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop : 10,  

  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 0,
    color: '#6A1B9A',
   
  },

  SafetyArea: {
    width: 330,
    height: 400,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  
  navText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
    marginTop: 4,
  },
  
  firstCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 170,
    
    borderWidth: 3,
    borderColor: '#7132a0',
    
  },
  secondCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 110,
    
    borderWidth: 3,
    borderColor: '#7132a0',
    
  },
  thirdCircle: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 72.5,
    borderWidth: 1,
    borderColor: '#7132a0',
    backgroundColor: '#8b45b5',
    // backgroundColor: '#LinearGradient(90deg, #6a1b9a 0%, #240934 100%)',
  },
  iconCircle: {
    position: 'absolute',

    width: 60,
    height: 60,
    borderRadius: 39,
    backgroundColor: '#6a1b9a',
    borderWidth: 1,
    borderColor: '#240934',
    justifyContent: 'center',
    alignItems: 'center',
  },

  topleftIcon: {
    top: 55,
    left: 35,
  },
  bottomleftIcon: {
    bottom: 55,
    right: 35,
  },
  toprightIcon: {
    top: 55,
    right: 35,
  },
  bottomrightIcon: {
    bottom: 55,
    left: 35,

  },

  circleIcon: {
    width: 135,
    height: 135,

    borderRadius: 65,
    backgroundColor: '#7e3fa3',
    borderWidth: 9,
    borderColor: '#240934',
    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 5,
  },


  bottomTabs: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#c8b8d4',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderRadius: 15,
  },
  Tab: {
    alignItems: 'center',

  },
  ScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default HomeScreen;