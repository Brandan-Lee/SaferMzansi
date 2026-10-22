import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PURPLE = "#6B21A8";
const LIGHTER_PURPLE = "#F8F1FD";
const BACKGROUND = "#FAF7FF";
const MUTED = "#777777";

const SplashScreen = () => {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),

                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 55,
                    useNativeDriver: true,
                }),
            ]),

            Animated.timing(textAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]);
        animation.start(({ finished }) => {
            if (finished) {
                navigation.replace("LoginScreen");
            }
        });

        return () => animation.stop();
    }, [fadeAnim, scaleAnim, textAnim, navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <Animated.View
                    style={[
                        styles.logoArea,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.outerCircle}>
                        <View style={styles.middleCircle}>
                            <View style={styles.logoCircle}>
                                <MaterialCommunityIcons
                                    name="shield"
                                    size={58}
                                    color="#FFFFFF"
                                />
                                <MaterialCommunityIcons
                                    name="heart"
                                    size={18}
                                    color={PURPLE}
                                    style={styles.logoHeart}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity: textAnim,
                            transform: [
                                {
                                    translateY: textAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [10, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Text style={styles.appName}>SaferMzansi</Text>

                    <Text style={styles.tagline}>
                        Your safety. Your privacy.{"\n"}
                        Our priority.
                    </Text>
                </Animated.View>
            </View>

            <Animated.View
                style={[
                    styles.footer,
                    {
                        opacity: textAnim,
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name="shield-outline"
                    size={14}
                    color={PURPLE}

                />

                <Text style={styles.footerText}>Protected by SaferMzansi</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },

    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -20,
    },

    logoArea: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },

    outerCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1.5,
        borderColor: "#E5CFF6",
        alignItems: "center",
        justifyContent: "center",
    },

    middleCircle: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: LIGHTER_PURPLE,
        alignItems: "center",
        justifyContent: "center",
    },

    logoCircle: {
        position: "relative",
        width: 94,
        height: 94,
        borderRadius: 47,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",

        shadowColor: PURPLE,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 6,
    },

    logoHeart: {
        position: "absolute",
        top: 38,
    },

    textContainer: {
        alignItems: "center",
        justifyContent: "center",
    },

    appName: {
        fontSize: 36,
        fontWeight: "700",
        color: PURPLE,
        letterSpacing: 0.2,
        marginBottom: 17,
    },

    tagline: {
        fontSize: 16,
        lineHeight: 23,
        color: MUTED,
        textAlign: "center",
    },

    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
		paddingHorizontal: 20,
		paddingVertical: 24,
    },

    footerText: {
        marginLeft: 7,
        fontSize: 12,
        color: "#999999",
    },
});

export default SplashScreen;