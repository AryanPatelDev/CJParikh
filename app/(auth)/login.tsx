import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const LoginScreen = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isDark = theme === "dark";

  const VALID_CREDENTIALS = {
    MANAGER: {
      username: "CJParikh",
      password: "Manager@2024",
      role: "Manager",
    },
    USER: { username: "User", password: "User@2024", role: "User" },
  };

  const handleLogin = async () => {
    let userRole = null;

    if (
      username === VALID_CREDENTIALS.MANAGER.username &&
      password === VALID_CREDENTIALS.MANAGER.password
    ) {
      userRole = VALID_CREDENTIALS.MANAGER.role;
    } else if (
      username === VALID_CREDENTIALS.USER.username &&
      password === VALID_CREDENTIALS.USER.password
    ) {
      userRole = VALID_CREDENTIALS.USER.role;
    } else {
      Alert.alert(
        "Invalid Credentials",
        "Please enter valid username and password"
      );
      return;
    }

    try {
      await AsyncStorage.setItem("userRole", userRole);
      await AsyncStorage.setItem("lastLogin", new Date().toISOString());
      router.replace("/(app)/main");
    } catch (error) {
      Alert.alert("Error", "Could not save login information");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
    },
    logoContainer: {
      alignItems: "center",
      marginTop: 100,
      marginBottom: 50,
    },
    companyName: {
      fontSize: 32,
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#2c3e50",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      color: isDark ? "#cccccc" : "#7f8c8d",
    },
    formContainer: {
      paddingHorizontal: 30,
    },
    input: {
      backgroundColor: isDark ? "#333333" : "#f5f6fa",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: isDark ? "#444444" : "#dcdde1",
      color: isDark ? "#ffffff" : "#000000",
    },
    loginButton: {
      backgroundColor: "#3498db",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
    },
    loginButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "bold",
    },
    themeToggle: {
      position: "absolute",
      top: 50,
      right: 20,
      padding: 10,
    },
    themeIcon: {
      color: isDark ? "#ffffff" : "#000000",
    },
    versionText: {
      position: "absolute",
      bottom: 20,
      alignSelf: "center",
      color: isDark ? "#cccccc" : "#95a5a6",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Ionicons
          name={isDark ? "sunny" : "moon"}
          size={24}
          style={styles.themeIcon}
        />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Text style={styles.companyName}>CJ Parikh</Text>
        <Text style={styles.subtitle}>Business Management System</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor={isDark ? "#888888" : "#666666"}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={isDark ? "#888888" : "#666666"}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
