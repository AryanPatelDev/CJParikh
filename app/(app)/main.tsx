import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function MainScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");
      if (!role) {
        router.replace("/(auth)/login");
        return;
      }
      setUserRole(role);
    } catch (error) {
      console.error("Error loading user role:", error);
      router.replace("/(auth)/login");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["userRole", "lastLogin"]);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#1a1a1a" : "#f4f4f4",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: isDark ? "#ffffff" : "#000000",
    },
    options: {
      width: "80%",
      alignItems: "center",
    },
    button: {
      width: "100%",
      padding: 15,
      backgroundColor: isDark ? "#2980b9" : "#007bff",
      alignItems: "center",
      borderRadius: 8,
      marginVertical: 10,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
    },
    logoutButton: {
      marginTop: 20,
      padding: 10,
      backgroundColor: isDark ? "#c0392b" : "#dc3545",
      borderRadius: 8,
    },
    logoutText: {
      color: "#ffffff",
      fontSize: 14,
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
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Ionicons
          name={isDark ? "sunny" : "moon"}
          size={24}
          style={styles.themeIcon}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Welcome, {userRole}!</Text>

      {userRole === "Manager" ? (
        <View style={styles.options}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Approve Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>View Summary</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.options}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(app)/new-order")}
          >
            <Text style={styles.buttonText}>New Sales Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Process Orders</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
