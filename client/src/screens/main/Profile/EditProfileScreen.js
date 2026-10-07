import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "@expo/vector-icons/Ionicons";
import { useNavigation } from '@react-navigation/native';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        <View style={styles.backBtnheader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="chevron-back" size={24} color="#000"  />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>


        <View style={styles.header}>
            
			<View style={styles.logoBadge}>
                

				<Icon name="shield" size={34} color="#FFFFFF" />
				<Icon
					name="heart"
					size={14}
					color="#6B21A8"
					style={styles.logoBadgeHeart}
				/>
			</View>
			<Text style={styles.logoText}>SaferMzansi</Text>
            <Text style={styles.title}>Login and personal information</Text>
			{/* {Boolean(title) && <Text style={styles.title}>Edit Profile</Text>}
			{Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>} */}
		</View>

        <TextInput
          placeholder="Name"
          style={styles.input}
        />
        <TextInput
            placeholder="Surname"   
            style={styles.input}
        />
        <TextInput
          placeholder="Phone"
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
        />
        
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.goBack()} >
            <Text style={styles.editButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf7ff',
    
    
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 15,
    
    

  },
    backBtnheader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        height: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        
    },
    header: {
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 25,
        width: '100%',
    

    },
    logoBadge: {
		width: 58,
		height: 58,
		borderRadius: 16,
		backgroundColor: "#6B21A8",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	logoBadgeHeart: { position: "absolute" },
	logoText: {
		fontSize: 24,
		fontWeight: "800",
		color: "#6B21A8",
		marginBottom: 16,
        
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
		textAlign: "center",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		paddingHorizontal: 12,
        lineHeight: 20,
	},
    
  
   
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1f2937',
        backgroundColor: '#f9f9f9',
        height: 52,
    },

    editButton: {
        backgroundColor: '#6a1b9a',
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#6a1b9a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
        height: 50,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    }
});

export default EditProfileScreen;