import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth, API_URL } from '../../context/AuthContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const [role, setRole] = useState('subcontractor');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
        Alert.alert("Required", "Please fill in email and password.");
        return;
    }
    
    setLoading(true);
    try {
        if (isLogin) {
            // Login flow
            const res = await axios.post(`${API_URL}/api/auth/login/`, { email, password });
            
            const userData = res.data.user;
            
            if (userData.role === 'admin') {
                Alert.alert(
                    "Access Restricted", 
                    "You are an export house account. Please log in using the Web Portal."
                );
                setLoading(false);
                return;
            }
            
            login({ token: res.data.token, user: userData });
        } else {
            // Registration flow
            const mappedRole = role === 'export_house' ? 'admin' : 'subcontractor';
            await axios.post(`${API_URL}/api/auth/register/`, {
                username: `${firstName} ${lastName}`.trim(),
                email, 
                password, 
                role: mappedRole
            });
            Alert.alert("Success", "Account created successfully! Please log in.");
            setIsLogin(true);
        }
    } catch (error) {
        console.log("Auth Error:", error.message, error.response?.data);
        
        let errMsg = "Authentication failed.";
        if (error.response) {
            const data = error.response.data;
            if (typeof data === 'string') {
                errMsg = data;
            } else if (data?.error) {
                errMsg = data.error;
            } else if (data?.detail) {
                errMsg = data.detail;
            } else if (Array.isArray(data?.non_field_errors)) {
                errMsg = data.non_field_errors.join('\n');
            } else if (typeof data === 'object') {
                const msgs = Object.entries(data).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`);
                if (msgs.length > 0) errMsg = msgs.join('\n');
            }
        } else if (error.request) {
            errMsg = `Cannot connect to server at ${API_URL}.\n\nPlease ensure mobile & laptop are on the same network.`;
        } else {
            errMsg = error.message;
        }

        Alert.alert("Authentication Failed", errMsg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Header - Zedly Branding */}
        <View style={styles.topBar}>
          <View style={styles.brandGroup}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="cube-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.brandText}>Zedly</Text>
          </View>
        </View>

        {/* Form Content Area */}
        <View style={styles.contentArea}>
          
          <Text style={styles.kicker}>{isLogin ? 'WELCOME BACK' : 'START FOR FREE'}</Text>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>{isLogin ? 'Log in' : 'Create account'}</Text>
            <Text style={styles.titleDot}>.</Text>
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isLogin ? "New to Zedly? " : "Already A Member? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchLink}>{isLogin ? 'Create Account' : 'Log In'}</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs section */}
          <View style={styles.formContainer}>
            
            {!isLogin && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>ACCOUNT TYPE</Text>
                <View style={styles.roleSelectionGroup}>
                  <TouchableOpacity 
                    style={[styles.roleOption, role === 'subcontractor' && styles.roleOptionActive]}
                    onPress={() => setRole('subcontractor')}
                  >
                    <MaterialCommunityIcons name="factory" size={20} color={role === 'subcontractor' ? '#10b981' : '#64748b'} />
                    <Text style={[styles.roleOptionText, role === 'subcontractor' && styles.roleOptionTextActive]}>Subcontractor</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.roleOption, role === 'export_house' && styles.roleOptionActive]}
                    onPress={() => setRole('export_house')}
                  >
                    <MaterialCommunityIcons name="domain" size={20} color={role === 'export_house' ? '#10b981' : '#64748b'} />
                    <Text style={[styles.roleOptionText, role === 'export_house' && styles.roleOptionTextActive]}>Export House</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isLogin && (
              <View style={styles.rowInputs}>
                <View style={styles.flexHalf}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.input}
                      placeholder="Jane"
                      placeholderTextColor="#94a3b8"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                    <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
                  </View>
                </View>

                <View style={styles.flexHalf}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#94a3b8"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                    <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="superadmin@lexora.ai"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" />
            </View>

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <MaterialCommunityIcons name="eye-off-outline" size={20} color="#94a3b8" />
            </View>

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Working...' : (isLogin ? 'Log In' : 'Create account')}</Text>
            </TouchableOpacity>

          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Clean white background like web
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#10b981', // solid emerald
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  contentArea: {
    paddingHorizontal: 8,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  titleDot: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10b981',
  },
  switchRow: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  switchText: {
    color: '#64748b',
    fontSize: 15,
  },
  switchLink: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 15,
  },
  formContainer: {
    width: '100%',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  flexHalf: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9', // Very soft slate background
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
    height: '100%',
    marginRight: 10,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  forgotText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#059669', // Deeper emerald for button
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  roleSelectionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  roleOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  roleOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  roleOptionTextActive: {
    color: '#10b981',
  }
});
