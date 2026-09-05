import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function CuteCloudMascot({ entranceAnim }) {
  const eyeBlink = useRef(new Animated.Value(1)).current; 
  const eyeLook = useRef(new Animated.Value(0)).current; 
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(eyeBlink, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(eyeBlink, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(eyeLook, { toValue: 8, duration: 400, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(eyeBlink, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(eyeBlink, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(eyeLook, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(eyeLook, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, [eyeBlink, eyeLook]);

  const translateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [250, 0] 
  });

  return (
    <Animated.View style={[styles.mascotContainer, { transform: [{ translateY }] }]}>
      <View style={[styles.cloudBump, { width: 120, height: 120, left: 30, top: -50 }]} />
      <View style={[styles.cloudBump, { width: 160, height: 160, left: 110, top: -80 }]} />
      <View style={[styles.cloudBump, { width: 100, height: 100, right: 40, top: -30 }]} />

      <View style={styles.cloudBody}>
        <View style={[styles.cheek, { left: 40 }]} />
        
        <View style={[styles.eye, { left: 70 }]}>
          <Animated.View style={[styles.pupilGroup, { transform: [{ scaleY: eyeBlink }, { translateX: eyeLook }] }]}>
            <View style={styles.eyeBg} />
            <View style={styles.eyeHighlight1} />
            <View style={styles.eyeHighlight2} />
          </Animated.View>
        </View>

        <View style={styles.smile} />

        <View style={[styles.eye, { right: 70 }]}>
          <Animated.View style={[styles.pupilGroup, { transform: [{ scaleY: eyeBlink }, { translateX: eyeLook }] }]}>
            <View style={styles.eyeBg} />
            <View style={styles.eyeHighlight1} />
            <View style={styles.eyeHighlight2} />
          </Animated.View>
        </View>
        
        <View style={[styles.cheek, { right: 40 }]} />
      </View>
    </Animated.View>
  );
}

export default function SplashScreen({ fadeOutAnim }) {
  const logoFade = useRef(new Animated.Value(0)).current; 
  const entranceAnim = useRef(new Animated.Value(0)).current; 
  
  useEffect(() => {
    Animated.timing(logoFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(entranceAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, [logoFade, entranceAnim]);

  return (
    <Animated.View style={[styles.splashOverlay, { opacity: fadeOutAnim }]}>
      <LinearGradient
        colors={['#34d399', '#059669', '#0f766e']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.topBrand, { opacity: logoFade }]}>
          <MaterialCommunityIcons name="cube-outline" size={24} color="#fff" />
          <Text style={styles.brandName}>zedly</Text>
        </Animated.View>

        <Animated.View style={[
          styles.centerTextContainer, 
          { 
            opacity: entranceAnim,
            transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }
        ]}>
          <Text style={styles.bigText}>Your supply chain</Text>
          <Text style={[styles.bigText, { color: 'rgba(255,255,255,0.7)' }]}>in one place</Text>
        </Animated.View>

        <CuteCloudMascot entranceAnim={entranceAnim} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradientBg: {
    flex: 1,
    alignItems: 'center',
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  brandName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerTextContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  bigText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    lineHeight: 52,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: -40,
    width: width,
    height: 250,
    alignItems: 'center',
  },
  cloudBump: {
    position: 'absolute',
    backgroundColor: '#a7f3d0', 
    borderRadius: 999,
  },
  cloudBody: {
    position: 'absolute',
    bottom: 0,
    width: width * 1.1,
    height: 200,
    backgroundColor: '#a7f3d0',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    position: 'absolute',
    top: 60,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupilGroup: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeBg: {
    position: 'absolute',
    width: 44,
    height: 44,
    backgroundColor: '#064e3b', 
    borderRadius: 24,
    transform: [{ rotate: '15deg' }]
  },
  eyeHighlight1: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 7,
  },
  eyeHighlight2: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  cheek: {
    position: 'absolute',
    top: 90,
    width: 24,
    height: 16,
    backgroundColor: '#34d399', 
    borderRadius: 12,
    opacity: 0.6,
  },
  smile: {
    position: 'absolute',
    top: 95,
    width: 16,
    height: 8,
    borderBottomWidth: 3,
    borderColor: '#064e3b',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  }
});
