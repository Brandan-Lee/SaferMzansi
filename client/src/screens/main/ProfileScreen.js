import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile </Text>

          <View style={{ width: 35 }} /> 
        </View>
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={50} color="#000" />

          </View>
          <Text style={styles.profileName}>Brian Steel</Text>
          <Text style={styles.profileEmail}>briansteel7@example.com</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfileScreen')} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>Brian </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Surname</Text>
            <Text style={styles.infoValue}>Steel</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>email:</Text>
            <Text style={styles.infoValue}>briansteel7@example.com</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>phone:</Text>
            <Text style={styles.infoValue}>+27 63 456 7890</Text>
          </View>
        
        
        
        <Text style={styles.sectionTitle}>Security</Text>
          
        <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('ResetPasswordScreen')}> 
          <Feather name="lock" size={24} color="#000" style={{ marginRight: 'auto' }} />
          <Text style={styles.changePasswordbtn}>Change Password</Text>
          
        </TouchableOpacity> 

        <TouchableOpacity style={styles.logoutButton} onPress={() =>{ console.log(' Log out')}}>
          <Feather name="log-out" size={24} color="#000" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
          





      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8eeff',
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  header: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'flex-start',
    
  },
  headerTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    color : '#000',
  },
  profileSection: { 
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  profileCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e7d5fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 1,
  },
  profileEmail: {
    fontSize: 13,
    color: '#555',
    marginTop: 1,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#6a1b9a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 18,
    height: 46,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 5,
    marginTop: 0,
  },
  infoSection: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#e7d5fa',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
    fontWeight: '700',
  },
  optionButton: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e7d5fa',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 0,
    alignItems: 'center',
    flexDirection: 'row',
  },
  changePasswordbtn: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    marginLeft: 15,
    height: 20,
  },
  logoutButton: {
    height: 46, 
    borderRadius: 8,
    backgroundColor: '#6a1b9a',
    justifyContent: 'center',
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 15,
  },


});

export default ProfileScreen;
