import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  useRoute,
} from "@react-navigation/native";

import type {
  RouteProp,
} from "@react-navigation/native";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type QuestionsRouteProp =
  RouteProp<
    RootStackParamList,
    "ProductQuestions"
  >;


export default function ProductQuestionsScreen() {

  const route =
    useRoute<QuestionsRouteProp>();

 const {
  productId,
  productName,
  vendorId,
  vendorName,
} = route.params;

  const [question, setQuestion] =
    useState("");

  const [questions, setQuestions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);


  useEffect(() => {

    loadQuestions();

  }, []);


  async function loadQuestions() {

    try {

      const questionsQuery =
        query(
          collection(
            db,
            "productQuestions"
          ),
          where(
            "productId",
            "==",
            productId
          )
        );

      const snapshot =
        await getDocs(
          questionsQuery
        );

      const data =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );

      setQuestions(data);

    } catch (error) {

      console.log(
        "Question loading error:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  async function submitQuestion() {

    const user =
      auth.currentUser;


    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login before asking a question."
      );

      return;

    }


    if (
      !question.trim()
    ) {

      Alert.alert(
        "Question Required",
        "Please enter your question."
      );

      return;

    }


    try {

      setSubmitting(true);


      await addDoc(
        collection(
          db,
          "productQuestions"
        ),
        {

          productId: productId,

productName: productName,

vendorId: vendorId,

vendorName: vendorName,

userId: user.uid,

          customerName:
            user.displayName ||
            "Customer",

          customerEmail:
            user.email || "",

          question:
            question.trim(),

          answer:
            "",

          status:
            "Pending",

          createdAt:
            serverTimestamp(),

        }
      );


      setQuestion("");


      Alert.alert(
        "Question Submitted",
        "Your question has been submitted successfully."
      );


      await loadQuestions();

    } catch (error) {

      console.log(
        "Question submission error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to submit your question."
      );

    } finally {

      setSubmitting(false);

    }

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Product Questions
        </Text>

        <Text
          style={styles.productName}
        >
          {productName}
        </Text>

      </View>


      <View
        style={styles.askBox}
      >

        <TextInput
          style={styles.input}
          placeholder="Ask a question about this product..."
          placeholderTextColor="#999999"
          value={question}
          onChangeText={
            setQuestion
          }
          multiline
          maxLength={300}
        />


        <TouchableOpacity
          style={styles.submitButton}
          onPress={
            submitQuestion
          }
          disabled={
            submitting
          }
        >

          {submitting ? (

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

          ) : (

            <Text
              style={
                styles.submitButtonText
              }
            >
              Ask Question
            </Text>

          )}

        </TouchableOpacity>

      </View>


      {loading ? (

        <View
          style={styles.loading}
        >

          <ActivityIndicator
            size="small"
            color="#16A34A"
          />

        </View>

      ) : (

        <FlatList
          data={questions}
          keyExtractor={(
            item
          ) =>
            item.id
          }
          contentContainerStyle={
            styles.list
          }
          ListEmptyComponent={

            <View
              style={styles.empty}
            >

              <MaterialIcons
                name="help-outline"
                size={40}
                color="#BBBBBB"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No questions yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Be the first to ask
                a question.
              </Text>

            </View>

          }
          renderItem={({
            item,
          }) => (

            <View
              style={styles.questionCard}
            >

              <Text
                style={
                  styles.questionLabel
                }
              >
                Q
              </Text>

              <Text
                style={
                  styles.questionText
                }
              >
                {item.question}
              </Text>


              {item.answer ? (

                <View
                  style={styles.answerBox}
                >

                  <Text
                    style={
                      styles.answerLabel
                    }
                  >
                    Answer
                  </Text>

                  <Text
                    style={
                      styles.answerText
                    }
                  >
                    {item.answer}
                  </Text>

                </View>

              ) : (

                <Text
                  style={
                    styles.pendingText
                  }
                >
                  Waiting for an answer
                </Text>

              )}

            </View>

          )}
        />

      )}

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
    },

    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    title: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222222",
    },

    productName: {
      marginTop: 4,
      fontSize: 12,
      color: "#777777",
    },

    askBox: {
      backgroundColor: "#FFFFFF",
      padding: 12,
    },

    input: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 12,
      color: "#333333",
      textAlignVertical: "top",
    },

    submitButton: {
      height: 42,
      marginTop: 9,
      borderRadius: 8,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    list: {
      padding: 12,
      paddingBottom: 25,
    },

    questionCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      padding: 12,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    questionLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: "#16A34A",
    },

    questionText: {
      marginTop: 4,
      fontSize: 13,
      color: "#333333",
      lineHeight: 19,
    },

    answerBox: {
      marginTop: 10,
      paddingTop: 9,
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
    },

    answerLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: "#16A34A",
    },

    answerText: {
      marginTop: 4,
      fontSize: 12,
      color: "#555555",
      lineHeight: 18,
    },

    pendingText: {
      marginTop: 9,
      fontSize: 10,
      color: "#999999",
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 70,
      paddingHorizontal: 30,
    },

    emptyTitle: {
      marginTop: 9,
      fontSize: 15,
      fontWeight: "800",
      color: "#333333",
    },

    emptyText: {
      marginTop: 4,
      fontSize: 12,
      color: "#777777",
      textAlign: "center",
    },

  });