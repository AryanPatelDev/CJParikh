import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
const SHEETDB_URL = "https://sheetdb.io/api/v1/ti6x4c0w6u82k";
const SHEET_ID = "1PW9QYejHaAuQnevhKYEDYqvzhfw2cyvU2f9wnDu4Bf0";
const API_KEY = "AIzaSyCt94pkT0j8P3fAEQMHeq2KC0fvWi7wl10";

const NewSalesOrderScreen = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState("");
  const [products, setProducts] = useState([]);
  const [productList, setProductList] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [unit, setUnit] = useState("");
  const [rate, setRate] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderId, setOrderId] = useState("");

  // Network detection for reconnection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        // We've removed the draft submission functionality
        console.log("Network connected");
      }
    });

    return () => {
      unsubscribe(); // Ensure proper cleanup
    };
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${SHEETDB_URL}?sheet=Product_Master`);
      if (!response.data) throw new Error("No data received");

      if (Array.isArray(response.data)) {
        setProductList(
          response.data.map((row) => ({
            "Product GROUP CODE": row["Product GROUP CODE"] || "",
            "Product Group Name": row["Product Group Name"] || "",
            "Product CODE": row["Product CODE"] || "",
            "Product NAME": row["Product NAME"] || "",
            Rate: row["Rate"] || "0",
          }))
        );
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      Alert.alert("Error", "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async (letter) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${SHEETDB_URL}?sheet=Customer_Master`);
      console.log("Customer Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const filteredCustomers = response.data
          .filter((row) => row["Customer NAME"].startsWith(letter))
          .map((row) => ({
            "Customer CODE": row["Customer CODE"],
            "Customer NAME": row["Customer NAME"],
          }));
        setCustomers(filteredCustomers);
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
      Alert.alert("Error", "Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  const getNextOrderId = async () => {
    try {
      const today = new Date();
      const isAfterMarch = today.getMonth() >= 3; // April is 3 (0-based)
      const currentYear = today.getFullYear();
      const financialYear = isAfterMarch ? currentYear : currentYear - 1;
      const yearPrefix = `${financialYear}-${financialYear + 1}`;

      console.log("Searching for orders with prefix:", yearPrefix);
      const response = await axios.get(`${SHEETDB_URL}?sheet=New_Order_Table`);
      let maxId = 0;

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((order) => {
          if (order["ORDER ID"] && order["ORDER ID"].startsWith(yearPrefix)) {
            const [, idPart] = order["ORDER ID"].split("_");
            const id = parseInt(idPart);
            if (!isNaN(id) && id > maxId) {
              maxId = id;
            }
          }
        });
      }

      const nextId = String(maxId + 1).padStart(5, "0");
      const finalOrderId = `${yearPrefix}_${nextId}`;
      console.log("Generated Order ID:", finalOrderId);
      return finalOrderId;
    } catch (error) {
      console.error("Error fetching order IDs:", error);
      return null;
    }
  };

  const generateOrderId = async () => {
    const newOrderId = await getNextOrderId();
    if (newOrderId) {
      setOrderId(newOrderId);
    } else {
      // Fallback with correct financial year
      const today = new Date();
      const isAfterMarch = today.getMonth() >= 3;
      const currentYear = today.getFullYear();
      const financialYear = isAfterMarch ? currentYear : currentYear - 1;
      const yearPrefix = `${financialYear}-${financialYear + 1}`;
      const fallbackId = String(Math.floor(Math.random() * 99999)).padStart(
        5,
        "0"
      );
      setOrderId(`${yearPrefix}_${fallbackId}`);
    }
  };

  const handleProductSelect = (productCode) => {
    const product = productList.find((p) => p["Product CODE"] === productCode);
    if (product) {
      setSelectedProduct(product);
      setUnit("Unit");
      setRate(product["Rate"]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        if (mounted) {
          setIsLoading(true);
          await Promise.all([fetchProducts(), generateOrderId()]);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const formatIndianNumber = (num) => {
    try {
      const parts = num.toFixed(2).split(".");
      const lastThree = parts[0].substring(parts[0].length - 3);
      const otherNumbers = parts[0].substring(0, parts[0].length - 3);
      const formatted =
        otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
        (otherNumbers ? "," : "") +
        lastThree;
      return `${formatted}.${parts[1]}`;
    } catch (error) {
      console.error("Number formatting error:", error);
      return "0.00";
    }
  };

  const addProduct = () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select a product");
      return;
    }
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity greater than 0");
      return;
    }
    if (!unit) {
      Alert.alert("Error", "Please select a unit");
      return;
    }

    const numericQuantity = parseFloat(quantity);
    if (numericQuantity <= 0) {
      Alert.alert("Error", "Quantity must be greater than 0");
      return;
    }

    const numericRate = parseFloat(selectedProduct["Rate"]);
    if (isNaN(numericRate)) {
      Alert.alert("Error", "Invalid product rate");
      return;
    }

    const rawAmount = numericQuantity * numericRate;
    const formattedAmount = formatIndianNumber(rawAmount);

    const newProduct = {
      productName: selectedProduct["Product NAME"],
      quantity: numericQuantity.toString(),
      unit: "Unit",
      rate: formatIndianNumber(numericRate),
      orderAmount: formattedAmount,
    };

    setProducts([...products, newProduct]);
    setSelectedProduct(null);
    setQuantity("");
    setRate("");
  };

  // Format date to DD/MM/YYYY hh:mm AM/PM
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    // Convert to 12-hour format with AM/PM
    const hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    const formattedHours = String(hours12).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const submitOrder = async () => {
    if (!customerName) {
      Alert.alert("Error", "Please select a customer");
      return;
    }
    if (products.length === 0) {
      Alert.alert("Error", "Please add at least one product");
      return;
    }
    if (!orderId) {
      Alert.alert("Error", "Invalid order ID");
      return;
    }

    setIsLoading(true);
    try {
      const userRole = await AsyncStorage.getItem("userRole");
      if (!userRole) {
        throw new Error("User not logged in");
      }

      const orderRows = products.map((product) => ({
        "DATE-TIME": formatDate(new Date()),
        USER: userRole,
        "CUSTOMER NAME": customerName,
        "ORDER ID": orderId,
        "PRODUCT NAME": product.productName,
        QUANTITY: product.quantity,
        UNIT: product.unit,
        "PRODUCT RATE": product.rate,
        "ORDER AMOUNT": product.orderAmount,
        SOURCE: "App",
        "APPROVED BY MANAGER: Y/N": "N",
        "ORDER DISPATCHED: Y/N/P": "N",
      }));

      const response = await axios({
        method: "post",
        url: SHEETDB_URL,
        data: { data: orderRows },
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Submit Response:", response.data);

      if (response.data && response.data.created) {
        Alert.alert("Success", "Order submitted successfully", [
          { text: "OK", onPress: () => router.replace("/(app)/main") },
        ]);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to submit order. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      return sum + parseFloat(product.orderAmount.replace(/,/g, ""));
    }, 0);
  };

  // Create custom picker items with better visibility
  const renderPickerItems = (items, labelKey, valueKey) => {
    return items.map((item, index) => (
      <Picker.Item
        key={index}
        label={item[labelKey]}
        value={item[valueKey]}
        // On Android, we can't directly style the Picker.Item, but we ensure the contrast is good
        color={Platform.OS === "ios" ? (isDark ? "#ffffff" : "#000000") : null}
      />
    ));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "rgba(255, 255, 255, 0.7)", // Semi-transparent white
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 50,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#000000",
    },
    pickerContainer: {
      marginBottom: 15,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: isDark
        ? "rgba(30, 30, 30, 1)" // Darker background in dark mode for better contrast
        : "rgba(245, 246, 250, 0.8)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#dcdde1",
    },
    picker: {
      height: 50,
      backgroundColor: "transparent",
      color: isDark ? "#ffffff" : "#000000",
    },
    input: {
      backgroundColor: isDark
        ? "rgba(30, 30, 30, 1)" // Matching the picker background
        : "rgba(245, 246, 250, 0.8)",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#dcdde1",
      color: isDark ? "#ffffff" : "#000000",
    },
    button: {
      backgroundColor: "#3498db",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginVertical: 10,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
    },
    productItem: {
      backgroundColor: isDark
        ? "rgba(51, 51, 51, 0.8)"
        : "rgba(245, 246, 250, 0.8)", // Semi-transparent background
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(51, 51, 51, 0.5)"
        : "rgba(220, 221, 225, 0.5)",
    },
    productItemText: {
      color: isDark ? "#ffffff" : "#000000", // Changed to white in dark mode for better contrast
      fontSize: 16,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "right",
      marginVertical: 10,
      color: isDark ? "#ffffff" : "#000000",
    },
    orderIdText: {
      fontSize: 16,
      color: isDark ? "#bbbbbb" : "#666666", // Lighter color in dark mode
      marginBottom: 10,
    },
    actionButtons: {
      marginTop: 10,
      marginBottom: 20,
      gap: 10,
    },
    backButton: {
      padding: 10,
    },
    themeToggle: {
      padding: 10,
    },
    iconStyle: {
      color: isDark ? "#ffffff" : "#000000",
    },
    // Add a new style for custom dropdown that will replace the Picker on Android
    customDropdown: {
      padding: 15,
      backgroundColor: isDark ? "#333333" : "#f5f6fa",
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDark ? "#444444" : "#dcdde1",
    },
    customDropdownText: {
      color: isDark ? "#ffffff" : "#000000",
      fontSize: 16,
    },
    androidPickerDark: {
      backgroundColor: "#222222",
      color: "#ffffff",
    },
  });

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} style={styles.iconStyle} />
        </TouchableOpacity>
        <Text style={styles.title}>New Sales Order</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            style={styles.iconStyle}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <FlatList
        ListHeaderComponent={() => (
          <>
            <Text style={styles.orderIdText}>Order ID: {orderId}</Text>

            {/* Customer Selection */}
            <View style={styles.pickerContainer}>
              {Platform.OS === "ios" ? (
                <Picker
                  selectedValue={selectedLetter}
                  onValueChange={(itemValue) => {
                    setSelectedLetter(itemValue);
                    fetchCustomers(itemValue);
                  }}
                  style={styles.picker}
                  itemStyle={{ color: isDark ? "#ffffff" : "#000000" }}
                  dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                >
                  <Picker.Item label="Select Letter" value="" />
                  {[...Array(26)].map((_, i) => (
                    <Picker.Item
                      key={i}
                      label={String.fromCharCode(65 + i)}
                      value={String.fromCharCode(65 + i)}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  ))}
                </Picker>
              ) : (
                // On Android, use a darker background for the picker in dark mode
                <View
                  style={{
                    backgroundColor: isDark ? "#222222" : "#f5f6fa",
                    borderRadius: 8,
                  }}
                >
                  <Picker
                    selectedValue={selectedLetter}
                    onValueChange={(itemValue) => {
                      setSelectedLetter(itemValue);
                      fetchCustomers(itemValue);
                    }}
                    style={[
                      styles.picker,
                      isDark && {
                        color: "#ffffff",
                        backgroundColor: "#222222",
                      },
                    ]}
                    dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                  >
                    <Picker.Item label="Select Letter" value="" />
                    {[...Array(26)].map((_, i) => (
                      <Picker.Item
                        key={i}
                        label={String.fromCharCode(65 + i)}
                        value={String.fromCharCode(65 + i)}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.pickerContainer}>
              {Platform.OS === "ios" ? (
                <Picker
                  selectedValue={customerName}
                  onValueChange={setCustomerName}
                  style={styles.picker}
                  itemStyle={{ color: isDark ? "#ffffff" : "#000000" }}
                  dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                >
                  <Picker.Item label="Select Customer" value="" />
                  {customers.map((customer, index) => (
                    <Picker.Item
                      key={index}
                      label={customer["Customer NAME"]}
                      value={customer["Customer NAME"]}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  ))}
                </Picker>
              ) : (
                // Darker background for Android picker in dark mode
                <View
                  style={{
                    backgroundColor: isDark ? "#222222" : "#f5f6fa",
                    borderRadius: 8,
                  }}
                >
                  <Picker
                    selectedValue={customerName}
                    onValueChange={setCustomerName}
                    style={[
                      styles.picker,
                      isDark && {
                        color: "#ffffff",
                        backgroundColor: "#222222",
                      },
                    ]}
                    dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                  >
                    <Picker.Item label="Select Customer" value="" />
                    {customers.map((customer, index) => (
                      <Picker.Item
                        key={index}
                        label={customer["Customer NAME"]}
                        value={customer["Customer NAME"]}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Product Selection */}
            <View style={styles.pickerContainer}>
              {Platform.OS === "ios" ? (
                <Picker
                  selectedValue={selectedProduct?.["Product CODE"]}
                  onValueChange={handleProductSelect}
                  style={styles.picker}
                  itemStyle={{ color: isDark ? "#ffffff" : "#000000" }}
                  dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                >
                  <Picker.Item label="Select Product" value="" />
                  {productList.map((product, index) => (
                    <Picker.Item
                      key={index}
                      label={`${product["Product NAME"]} (₹${formatIndianNumber(
                        parseFloat(product["Rate"])
                      )})`}
                      value={product["Product CODE"]}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  ))}
                </Picker>
              ) : (
                // Darker background for Android picker in dark mode
                <View
                  style={{
                    backgroundColor: isDark ? "#222222" : "#f5f6fa",
                    borderRadius: 8,
                  }}
                >
                  <Picker
                    selectedValue={selectedProduct?.["Product CODE"]}
                    onValueChange={handleProductSelect}
                    style={[
                      styles.picker,
                      isDark && {
                        color: "#ffffff",
                        backgroundColor: "#222222",
                      },
                    ]}
                    dropdownIconColor={isDark ? "#ffffff" : "#000000"}
                  >
                    <Picker.Item label="Select Product" value="" />
                    {productList.map((product, index) => (
                      <Picker.Item
                        key={index}
                        label={`${
                          product["Product NAME"]
                        } (₹${formatIndianNumber(
                          parseFloat(product["Rate"])
                        )})`}
                        value={product["Product CODE"]}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Quantity Input with fixed keyboard issue */}
            {selectedProduct && (
              <TextInput
                style={styles.input}
                placeholder="Enter Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor={isDark ? "#bbbbbb" : "#666666"}
                // Prevent keyboard from dismissing on submit
                returnKeyType="done"
                blurOnSubmit={false}
              />
            )}

            {/* Add Product Button */}
            {selectedProduct && quantity && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#3498db" }]}
                onPress={addProduct}
              >
                <Text style={styles.buttonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Text style={styles.productItemText}>
              {`${item.productName}\nQty: ${item.quantity} ${item.unit} @ ₹${item.rate}\nAmount: ₹${item.orderAmount}`}
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <>
            <Text style={styles.totalAmount}>
              Total: ₹{formatIndianNumber(calculateTotal())}
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isLoading ? "#95a5a6" : "#2ecc71" },
              ]}
              onPress={submitOrder}
              disabled={isLoading || products.length === 0}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Please wait..." : "Submit Order"}
              </Text>
            </TouchableOpacity>
          </>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text
            style={[
              styles.productItemText,
              {
                textAlign: "center",
                marginTop: 20,
                color: isDark ? "#ffffff" : "#000000",
              },
            ]}
          >
            No products added yet
          </Text>
        )}
      />

      {isLoading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={isDark ? "#ffffff" : "#000000"}
          />
        </View>
      )}
    </View>
  );
};

export default NewSalesOrderScreen;
